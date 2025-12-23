import type { iBudget } from "./budget-ts";
import type { iCensus } from "./census-ts";
import { EventEmitter } from "../utils/eventEmitter-ts";
import { VALVES_UPDATED } from "../utils/messages";

import { miscUtilsController } from "../utils/miscUtils-ts";

export type iValves = typeof valvesController;
export const valvesController = {
  resValve: 0,
  comValve: 0,
  indValve: 0,
  resCap: false,
  comCap: false,
  indCap: false,
  RES_VALVE_RANGE: 2000,
  COM_VALVE_RANGE: 1500,
  IND_VALVE_RANGE: 1500,
  taxTable: [200, 150, 120, 100, 80, 50, 30, 0, -10, -40, -100, -150, -200, -250, -300, -350, -400, -450, -500, -550, -600],
  extMarketParamTable: [1.2, 1.1, 0.98],
  create() {
    EventEmitter(this);
    return this;
  },
  save(saveData) {
    saveData.resValve = this.resValve;
    saveData.comValve = this.comValve;
    saveData.indValve = this.indValve;
  },
  load(saveData) {
    this.resValve = saveData.resValve;
    this.comValve = saveData.comValve;
    this.indValve = saveData.indValve;

    this._emitEvent(VALVES_UPDATED);
  },
  setValves(gameLevel: number, census: iCensus, budget: iBudget) {
    const resPopDenom = 8;
    const birthRate = 0.02;
    const labourBaseMax = 1.3;
    const internalMarketDenom = 3.7;
    const projectedIndPopMin = 5.0;
    const resRatioDefault = 1.3;
    const resRatioMax = 2;
    const comRatioMax = 2;
    const indRatioMax = 2;
    const taxMax = 20;
    const taxTableScale = 600;
    let employment, labourBase;

    // Residential zones scale their population index when reporting it to the census
    const normalizedResPop = census.resPop / resPopDenom;
    census.totalPop = Math.round(normalizedResPop + census.comPop + census.indPop);
    if (census.resPop > 0) {
      employment = (census.comHist10[1] + census.indHist10[1]) / normalizedResPop;
    } else {
      employment = 1;
    }
    // Given the employment rate, calculate expected migration, add in births, and project the new population.
    const migration = normalizedResPop * (employment - 1);
    const births = normalizedResPop * birthRate;
    const projectedResPop = normalizedResPop + migration + births;

    // Examine how many zones require workers
    labourBase = census.comHist10[1] + census.indHist10[1];
    if (labourBase > 0.0) {
      labourBase = census.resHist10[1] + census.indHist10[1];
    } else {
      labourBase = 1;
    }
    labourBase = miscUtilsController.clamp(labourBase, 0.0, labourBaseMax);

    // Project future industry and commercial needs, taking into account available labour, and competition from
    // other global cities
    const internalMarket = (normalizedResPop + census.comPop + census.indPop) / internalMarketDenom;
    const projectedComPop = internalMarket * labourBase;
    let projectedIndPop = census.indPop * labourBase * this.extMarketParamTable[gameLevel];
    projectedIndPop = Math.max(projectedIndPop, projectedIndPopMin);
    // Calculate the expected percentage changes in each population type
    let resRatio;
    if (normalizedResPop > 0) {
      resRatio = projectedResPop / normalizedResPop;
    } else {
      resRatio = resRatioDefault;
    }
    let comRatio;
    if (census.comPop > 0) {
      comRatio = projectedComPop / census.comPop;
    } else {
      comRatio = projectedComPop;
    }
    let indRatio;
    if (census.indPop > 0) {
      indRatio = projectedIndPop / census.indPop;
    } else {
      indRatio = projectedIndPop;
    }
    resRatio = Math.min(resRatio, resRatioMax);
    comRatio = Math.min(comRatio, comRatioMax);
    indRatio = Math.min(indRatio, indRatioMax);
    // Constrain growth according to the tax level.

    const z = Math.min(budget.cityTax + gameLevel, taxMax);
    resRatio = (resRatio - 1) * taxTableScale + this.taxTable[z];
    comRatio = (comRatio - 1) * taxTableScale + this.taxTable[z];
    indRatio = (indRatio - 1) * taxTableScale + this.taxTable[z];

    this.resValve = miscUtilsController.clamp(this.resValve + Math.round(resRatio), -this.RES_VALVE_RANGE, this.RES_VALVE_RANGE);
    this.comValve = miscUtilsController.clamp(this.comValve + Math.round(comRatio), -this.COM_VALVE_RANGE, this.COM_VALVE_RANGE);
    this.indValve = miscUtilsController.clamp(this.indValve + Math.round(indRatio), -this.IND_VALVE_RANGE, this.IND_VALVE_RANGE);

    if (this.resCap && this.resValve > 0) {
      this.resValve = 0;
    }

    if (this.comCap && this.comValve > 0) {
      this.comValve = 0;
    }

    if (this.indCap && this.indValve > 0) {
      this.indValve = 0;
    }

    this._emitEvent(VALVES_UPDATED);
  },
  _emitEvent(_event: string, _subject?: Object) {
    //todo Event emiter
    return;
  },
};
