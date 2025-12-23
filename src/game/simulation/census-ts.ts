import type { iBudget } from "./budget-ts";
import { miscUtilsController } from "../utils/miscUtils-ts";

export type iCensus = typeof censusController;
export const censusController = {
  poweredZoneCount: 0,
  unpoweredZoneCount: 0,
  firePop: 0,
  roadTotal: 0,
  railTotal: 0,
  resPop: 0,
  comPop: 0,
  indPop: 0,
  resZonePop: 0,
  comZonePop: 0,
  indZonePop: 0,
  hospitalPop: 0,
  churchPop: 0,
  policeStationPop: 0,
  fireStationPop: 0,
  stadiumPop: 0,
  coalPowerPop: 0,
  nuclearPowerPop: 0,
  seaportPop: 0,
  airportPop: 0,
  changed: false,
  crimeRamp: 0,
  pollutionRamp: 0,
  saveProps: [
    "resPop",
    "comPop",
    "indPop",
    "crimeRamp",
    "pollutionRamp",
    "landValueAverage",
    "pollutionAverage",
    "crimeAverage",
    "totalPop",
    "resHist10",
    "resHist120",
    "comHist10",
    "comHist120",
    "indHist10",
    "indHist120",
    "crimeHist10",
    "crimeHist120",
    "moneyHist10",
    "moneyHist120",
    "pollutionHist10",
    "pollutionHist120",
  ],
  // Set externally
  landValueAverage: 0,
  pollutionAverage: 0,
  crimeAverage: 0,
  totalPop: 0,
  trafficAverage: 0,
  arrs: ["res", "com", "ind", "crime", "money", "pollution"],
  resHist10: [],
  comHist10: [],
  indHist10: [],
  crimeHist10: [],
  pollutionHist10: [],
  moneyHist10: [],
  needHospital: 0,
  resHist120: [],
  comHist120: [],
  indHist120: [],
  crimeHist120: [],
  pollutionHist120: [],
  moneyHist120: [],
  create() {
    this.clearCensus();
    const self = this;
    const createArray = function (arrName: string) {
      self[arrName] = [];
      for (let a = 0; a < 120; a++) {
        self[arrName][a] = 0;
      }
    };

    for (let i = 0; i < this.arrs.length; i++) {
      const name10 = this.arrs[i] + "Hist10";
      const name120 = this.arrs[i] + "Hist120";
      createArray.call(this, name10);
      createArray.call(this, name120);
    }
    return this;
  },
  take10Census(budget: iBudget) {
    const resPopDenom = 8;
    this.rotate10Arrays.call(this);

    this.resHist10[0] = Math.floor(this.resPop / resPopDenom);
    this.comHist10[0] = this.comPop;
    this.indHist10[0] = this.indPop;

    this.crimeRamp += Math.floor((this.crimeAverage - this.crimeRamp) / 4);
    this.crimeHist10[0] = Math.min(this.crimeRamp, 255);

    this.pollutionRamp += Math.floor((this.pollutionAverage - this.pollutionRamp) / 4);
    this.pollutionHist10[0] = Math.min(this.pollutionRamp, 255);

    const x = Math.floor(budget.cashFlow / 20) + 128;
    this.moneyHist10[0] = miscUtilsController.clamp(x, 0, 255);

    const resPopScaled = this.resPop >> 8;
    if (this.hospitalPop < resPopScaled) {
      this.needHospital = 1;
    } else if (this.hospitalPop > resPopScaled) {
      this.needHospital = -1;
    } else if (this.hospitalPop === resPopScaled) {
      this.needHospital = 0;
    }
    this.changed = true;
  },
  take120Census() {
    const resPopDenom = 8;
    this.rotate120Arrays.call(this);

    this.resHist120[0] = Math.floor(this.resPop / resPopDenom);
    this.comHist120[0] = this.comPop;
    this.indHist120[0] = this.indPop;
    this.crimeHist120[0] = this.crimeHist10[0];
    this.pollutionHist120[0] = this.pollutionHist10[0];
    this.moneyHist120[0] = this.moneyHist10[0];
    this.changed = true;
  },
  save(saveData) {
    for (let i = 0, l = this.saveProps.length; i < l; i++) {
      saveData[this.saveProps[i]] = this[this.saveProps[i]];
    }
  },
  load(saveData) {
    for (var i = 0, l = this.saveProps.length; i < l; i++) {
      this[this.saveProps[i]] = saveData[this.saveProps[i]];
    }
  },
  rotate10Arrays() {
    for (let i = 0; i < this.arrs.length; i++) {
      var name10 = this.arrs[i] + "Hist10";
      this[name10].pop();
      this[name10].unshift(0);
    }
  },
  rotate120Arrays() {
    for (var i = 0; i < this.arrs.length; i++) {
      var name120 = this.arrs[i] + "Hist120";
      this[name120].pop();
      this[name120].unshift(0);
    }
  },
  clearCensus() {
    this.poweredZoneCount = 0;
    this.unpoweredZoneCount = 0;
    this.firePop = 0;
    this.roadTotal = 0;
    this.railTotal = 0;
    this.resPop = 0;
    this.comPop = 0;
    this.indPop = 0;
    this.resZonePop = 0;
    this.comZonePop = 0;
    this.indZonePop = 0;
    this.hospitalPop = 0;
    this.churchPop = 0;
    this.policeStationPop = 0;
    this.fireStationPop = 0;
    this.stadiumPop = 0;
    this.coalPowerPop = 0;
    this.nuclearPowerPop = 0;
    this.seaportPop = 0;
    this.airportPop = 0;
  },
};
