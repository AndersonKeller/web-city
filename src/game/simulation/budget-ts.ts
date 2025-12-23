import { EventEmitter } from "../utils/eventEmitter-ts.ts";
import { miscUtilsController } from "../utils/miscUtils-ts.ts";
import * as Messages from "../utils/messages.ts";
import type { iCensus } from "./census-ts";

export type iBudget = typeof budgetController;
interface iBudgetCensus extends iCensus {}

export const budgetController = {
  MAX_ROAD_EFFECT: miscUtilsController.makeConstantDescriptor(32),
  MAX_POLICESTATION_EFFECT: miscUtilsController.makeConstantDescriptor(1000),
  MAX_FIRESTATION_EFFECT: miscUtilsController.makeConstantDescriptor(1000),
  roadEffect: 32 as number,
  policeEffect: 1000 as number,
  fireEffect: 1000 as number,
  totalFunds: 0,

  cityTax: 7,
  cashFlow: 0,
  taxFund: 0,
  roadMaintenanceBudget: 0,
  fireMaintenanceBudget: 0,
  policeMaintenanceBudget: 0,
  roadPercent: 1,
  firePercent: 1,
  policePercent: 1,
  roadSpend: 0,
  fireSpend: 0,
  policeSpend: 0,
  awaitingValues: false,
  autoBudget: true,
  saveProps: [
    "autoBudget",
    "totalFunds",
    "policePercent",
    "roadPercent",
    "firePercent",
    "roadSpend",
    "policeSpend",
    "fireSpend",
    "roadMaintenanceBudget",
    "policeMaintenanceBudget",
    "fireMaintenanceBudget",
    "cityTax",
    "roadEffect",
    "policeEffect",
    "fireEffect",
  ],
  RLevels: [0.7, 0.9, 1.2],
  FLevels: [1.4, 1.2, 0.8],
  policeMaintenanceCost: 100,
  fireMaintenanceCost: 100,
  roadMaintenanceCost: 1,
  railMaintenanceCost: 1,
  create() {
    this.roadEffect = Number(this.MAX_ROAD_EFFECT.value);
    this.policeEffect = Number(this.MAX_POLICESTATION_EFFECT.value);
    this.fireEffect = Number(this.MAX_FIRESTATION_EFFECT.value);

    EventEmitter(this);
  },
  save(saveData) {
    for (let i = 0; i < this.saveProps.length; i++) {
      saveData[this.saveProps[i]] = this[this.saveProps[i]];
    }
  },
  load(saveData) {
    for (var i = 0, l = this.saveProps.length; i < l; i++) this[this.saveProps[i]] = saveData[this.saveProps[i]];

    this._emitEvent(Messages.AUTOBUDGET_CHANGED, this.autoBudget);
    //this._emitEvent(Messages.FUNDS_CHANGED, this.totalFunds);
    this.setFunds(this.totalFunds);
  },
  setAutoBudget(value: boolean) {
    this.autoBudget = value;
    this._emitEvent(Messages.AUTOBUDGET_CHANGED, this.autoBudget);
  },
  _calculateBestPercentages() {
    // How much would we be spending based on current percentages?
    // Note: the *Budget items are updated every January by collectTax
    this.roadSpend = Math.round(this.roadMaintenanceBudget * this.roadPercent);
    this.fireSpend = Math.round(this.fireMaintenanceBudget * this.firePercent);
    this.policeSpend = Math.round(this.policeMaintenanceBudget * this.policePercent);

    const total = this.roadSpend + this.fireSpend + this.policeSpend;
    // If we don't have any services on the map, we can bail early
    if (total === 0) {
      this.roadPercent = 1;
      this.firePercent = 1;
      this.policePercent = 1;
      return { road: 1, fire: 1, police: 1 };
    }
    // How much are we actually going to spend?
    let roadCost = 0;
    let fireCost = 0;
    let policeCost = 0;

    let cashRemaining = this.totalFunds + this.taxFund;
    // Spending priorities: road, fire, police
    if (cashRemaining >= this.roadSpend) roadCost = this.roadSpend;
    else roadCost = cashRemaining;
    cashRemaining -= roadCost;

    if (cashRemaining >= this.fireSpend) fireCost = this.fireSpend;
    else fireCost = cashRemaining;
    cashRemaining -= fireCost;

    if (cashRemaining >= this.policeSpend) policeCost = this.policeSpend;
    else policeCost = cashRemaining;
    cashRemaining -= policeCost;

    if (this.roadMaintenanceBudget > 0) this.roadPercent = Number((roadCost / this.roadMaintenanceBudget).toPrecision(2)) - 0;
    else this.roadPercent = 1;

    if (this.fireMaintenanceBudget > 0) this.firePercent = Number((fireCost / this.fireMaintenanceBudget).toPrecision(2)) - 0;
    else this.firePercent = 1;

    if (this.policeMaintenanceBudget > 0) this.policePercent = Number((policeCost / this.policeMaintenanceBudget).toPrecision(2)) - 0;
    else this.policePercent = 1;

    return { road: roadCost, police: policeCost, fire: fireCost };
  },
  // User initiated budget
  doBudgetWindow() {
    return this.doBudgetNow(true);
  },
  doBudgetNow(fromWindow: boolean) {
    const costs = this._calculateBestPercentages();

    if (!this.autoBudget && !fromWindow) {
      this.autoBudget = false;
      this.awaitingValues = true;
      this._emitEvent(Messages.BUDGET_NEEDED);
      return;
    }
    const roadCost = costs.road;
    const policeCost = costs.police;
    const fireCost = costs.fire;
    const totalCost = roadCost + policeCost + fireCost;
    const cashRemaining = this.totalFunds + this.taxFund - totalCost;

    //autoBudget
    if ((cashRemaining > 0 && this.autoBudget) || fromWindow) {
      this.awaitingValues = false;
      this.doBudgetSpend(roadCost, fireCost, policeCost);
      return;
    }
    // Uh-oh. Not enough money. Make this the user's problem.
    // They don't know it yet, but they're about to get a budget window.
    this.setAutoBudget(false);
    this.awaitingValues = true;
    this._emitEvent(Messages.BUDGET_NEEDED);
    this._emitEvent(Messages.NO_MONEY);
  },
  doBudgetSpend(roadValue: number, fireValue: number, policeValue: number) {
    this.roadSpend = roadValue;
    this.fireSpend = fireValue;
    this.policeSpend = policeValue;
    var total = this.roadSpend + this.fireSpend + this.policeSpend;

    this.spend(-(this.taxFund - total));
    this.updateFundEffects();
  },
  updateFundEffects() {
    // The caller is assumed to have correctly set the percentage spend
    this.roadSpend = Math.round(this.roadMaintenanceBudget * this.roadPercent);
    this.fireSpend = Math.round(this.fireMaintenanceBudget * this.firePercent);
    this.policeSpend = Math.round(this.policeMaintenanceBudget * this.policePercent);

    // Update the effect this level of spending will have on infrastructure deterioration
    this.roadEffect = Number(this.MAX_ROAD_EFFECT.value);
    this.policeEffect = Number(this.MAX_POLICESTATION_EFFECT.value);
    this.fireEffect = +this.MAX_FIRESTATION_EFFECT.value;

    if (this.roadMaintenanceBudget > 0) {
      this.roadEffect = Math.floor((this.roadEffect * this.roadSpend) / this.roadMaintenanceBudget);
    }

    if (this.fireMaintenanceBudget > 0) {
      this.fireEffect = Math.floor((this.fireEffect * this.fireSpend) / this.fireMaintenanceBudget);
    }

    if (this.policeMaintenanceBudget > 0) {
      this.policeEffect = Math.floor((this.policeEffect * this.policeSpend) / this.policeMaintenanceBudget);
    }
  },
  collectTax(gameLevel: number, census: iBudgetCensus) {
    this.cashFlow = 0;
    // How much would it cost to fully fund every service?
    this.policeMaintenanceBudget = census.policeStationPop * this.policeMaintenanceCost;
    this.fireMaintenanceBudget = census.fireStationPop * this.fireMaintenanceCost;

    const roadCost = census.roadTotal * this.roadMaintenanceCost;
    const railCost = census.railTotal * this.railMaintenanceCost;
    this.roadMaintenanceBudget = Math.floor((roadCost + railCost) * this.RLevels[gameLevel]);

    this.taxFund = Math.floor(Math.floor((census.totalPop * census.landValueAverage) / 120) * this.cityTax * this.FLevels[gameLevel]);

    if (census.totalPop > 0) {
      this.cashFlow = this.taxFund - (this.policeMaintenanceBudget + this.fireMaintenanceBudget + this.roadMaintenanceBudget);
      this.doBudgetNow(false);
    } else {
      // We don't want roads etc deteriorating when population hasn't yet been established
      // (particularly early game)
      this.roadEffect = +this.MAX_ROAD_EFFECT.value;
      this.policeEffect = +this.MAX_POLICESTATION_EFFECT.value;
      this.fireEffect = +this.MAX_FIRESTATION_EFFECT.value;
    }
  },
  setTax(amount: number) {
    if (amount === this.cityTax) {
      return;
    }
    this.cityTax = amount;
  },
  spend(amount: number) {
    this.setFunds(this.totalFunds - amount);
  },
  setFunds(amount: number) {
    if (amount === this.totalFunds) {
      return;
    }
    this.totalFunds = Math.max(0, amount);

    this._emitEvent(Messages.FUNDS_CHANGED, this.totalFunds);
    if (this.totalFunds === 0) {
      this._emitEvent(Messages.NO_MONEY);
    }
  },
  shouldDegradeRoad() {
    return this.roadEffect < Math.floor((15 * +this.MAX_ROAD_EFFECT.value) / 16);
  },
  _emitEvent(_event, _subject?: Object) {
    //for handling EventEmitter()

    return;
  },
};
