import { type BlockMapSimulation, type iSimulation } from "./simulation-ts";
import { EventEmitter } from "../utils/eventEmitter-ts";
import type { iCensus } from "./census-ts";
import type { iBudget } from "./budget-ts";

import { miscUtilsController } from "../utils/miscUtils-ts";
import { CLASSIFICATION_UPDATED, POPULATION_UPDATED, SCORE_UPDATED } from "../utils/messages";

import { Random } from "../utils/random";

export type iEvaluation = typeof evaluationController;
export const evaluationController = {
  PROBLEMS: ["CVP_CRIME", "CVP_POLLUTION", "CVP_HOUSING", "CVP_TAXES", "CVP_TRAFFIC", "CVP_UNEMPLOYMENT", "CVP_FIRE"],
  NUMPROBLEMS: 0,
  cityAssessedValue: 0,
  NUM_COMPLAINTS: 4,
  problemData: [],
  problemVotes: [],
  problemOrder: [],
  gameLevel: "",
  cityYes: 0,
  CC_VILLAGE: miscUtilsController.makeConstantDescriptor("VILLAGE"),
  CC_TOWN: miscUtilsController.makeConstantDescriptor("TOWN"),
  CC_CITY: miscUtilsController.makeConstantDescriptor("CITY"),
  CC_CAPITAL: miscUtilsController.makeConstantDescriptor("CAPITAL"),
  CC_METROPOLIS: miscUtilsController.makeConstantDescriptor("METROPOLIS"),
  CC_MEGALOPOLIS: miscUtilsController.makeConstantDescriptor("MEGALOPOLIS"),
  CRIME: miscUtilsController.makeConstantDescriptor(0),
  POLLUTION: miscUtilsController.makeConstantDescriptor(1),
  HOUSING: miscUtilsController.makeConstantDescriptor(2),
  TAXES: miscUtilsController.makeConstantDescriptor(3),
  TRAFFIC: miscUtilsController.makeConstantDescriptor(4),
  UNEMPLOYMENT: miscUtilsController.makeConstantDescriptor(5),
  FIRE: miscUtilsController.makeConstantDescriptor(6),
  cityPop: 0,
  cityPopDelta: 0,
  cityClass: "" as string | number,
  cityClassLast: "" as string | number,
  cityScore: 500,
  cityScoreDelta: 0,
  saveProps: ["cityClass", "cityScore"],
  create(gameLevel: number) {
    this.NUMPROBLEMS = this.PROBLEMS.length;
    this.evalInit();
    this.gameLevel = "" + gameLevel;
    EventEmitter(this);
    return this;
  },
  cityEvaluation(simData: iSimulation) {
    const census = simData.census;
    if (census.totalPop > 0) {
      for (let i = 0; i < this.NUMPROBLEMS; i++) {
        this.problemData.push(0);
      }
      this.getAssessedValue(census);
      this.getPopulation(census);
      this.doProblems(simData.census, simData.budget, simData.blockMaps);
      this.getScore(simData);
      this.doVotes();
    } else {
      this.evalInit();
      this.cityYes = 50;
    }
  },
  getAssessedValue(census: iCensus) {
    let value: number;

    value = census.roadTotal * 5;
    value += census.railTotal * 10;
    value += census.policeStationPop * 1000;
    value += census.fireStationPop * 1000;
    value += census.hospitalPop * 400;
    value += census.stadiumPop * 3000;
    value += census.seaportPop * 5000;
    value += census.airportPop * 10000;
    value += census.coalPowerPop * 3000;
    value += census.nuclearPowerPop * 6000;

    this.cityAssessedValue = value * 1000;
  },
  getPopulation(census: iCensus) {
    const oldPopulation = this.cityPop;
    this.cityPop = (census.resPop + (census.comPop + census.indPop) * 8) * 20;
    this.cityPopDelta = this.cityPop - oldPopulation;
    if (this.cityPopDelta !== 0) {
      this._emitEvent(POPULATION_UPDATED, this.cityPop);
    }

    return this.cityPop;
  },
  doProblems(census: iCensus, budget: iBudget, blockMaps: BlockMapSimulation) {
    this.problemData[this.CRIME.value] = census.crimeAverage;
    this.problemData[this.POLLUTION.value] = census.pollutionAverage;
    this.problemData[this.HOUSING.value] = (census.landValueAverage * 7) / 10;
    this.problemData[this.TAXES.value] = budget.cityTax * 10;

    this.problemData[this.TRAFFIC.value] = this.getTrafficAverage(blockMaps, census);
    this.problemData[this.UNEMPLOYMENT.value] = this.getUnemployment(census);
    this.problemData[this.FIRE.value] = this.getFireSeverity(census);

    this.voteProblems();

    this.problemVotes.sort((a, b) => {
      return b.voteCount - a.voteCount;
    });
    this.problemOrder = this.problemVotes.map((pv, index) => {
      if (index >= this.NUM_COMPLAINTS || pv.voteCount === 0) {
        return null;
      }
      return pv.index;
    });
  },
  getTrafficAverage(blockMaps: BlockMapSimulation, census: iCensus) {
    const trafficDensityMap = blockMaps.trafficDensityMap;
    const landValueMap = blockMaps.landValueMap;

    let trafficTotal = 0;
    let count = 1;

    for (let x = 0; x < landValueMap.gameMapWidth; x += landValueMap.blockSize) {
      for (let y = 0; y < landValueMap.gameMapHeight; y += landValueMap.blockSize) {
        if (landValueMap.worldGet(x, y) > 0) {
          trafficTotal += trafficDensityMap.worldGet(x, y);
          count++;
        }
      }
    }
    const trafficAverage = (census.trafficAverage = Math.floor(trafficTotal / count) * 2);

    return trafficAverage;
  },
  getUnemployment(census: iCensus) {
    let bounds = (census.comPop + census.indPop) * 8;
    if (bounds === 0) {
      return 0;
    }
    // Ratio total people / working. At least 1.
    const ratio = census.resPop / bounds;

    bounds = Math.round((ratio - 1) * 255);
    return Math.min(bounds, 255);
  },
  getFireSeverity(census: iCensus) {
    return Math.min(census.firePop * 5, 255);
  },
  voteProblems() {
    for (let i = 0; i < this.NUMPROBLEMS; i++) {
      this.problemVotes[i].index = i;
      this.problemVotes[i].voteCount = 0;
    }

    let problem = 0;
    let voteCount = 0;
    let loopCount = 0;

    // Try to acquire up to 100 votes on problems, but bail if it takes too long
    while (voteCount < 100 && loopCount < 600) {
      const voterProblemTolerance = Random.getRandom(300);
      if (this.problemData[problem] > voterProblemTolerance) {
        // The voter is upset about this problem
        this.problemVotes[problem].voteCount += 1;
        voteCount++;
      }

      problem = (problem + 1) % this.NUMPROBLEMS;
      loopCount++;
    }
  },
  getScore(simData: iSimulation) {
    const census = simData.census;
    const budget = simData.budget;
    const valves = simData.valves;

    const cityScoreLast = this.cityScore;
    let score = 0;
    for (let i = 0; i < this.NUMPROBLEMS; i++) {
      score += this.problemData[i];
    }
    score = Math.floor(score / 3);
    score = (250 - Math.min(score, 250)) * 4;
    // Penalise the player by 15% if demand for any type of zone is capped due
    // to lack of suitable buildings
    const demandPenalty = 0.85;
    if (valves.resCap) {
      score = Math.round(score * demandPenalty);
    }
    if (valves.comCap) {
      score = Math.round(score * demandPenalty);
    }
    if (valves.indCap) {
      score = Math.round(score * demandPenalty);
    }
    // Penalize if roads/rail underfunded
    if (budget.roadEffect < +budget.MAX_ROAD_EFFECT.value) {
      score -= +budget.MAX_ROAD_EFFECT.value - budget.roadEffect;
    }
    // Penalize player by up to 10% for underfunded police and fire services
    if (budget.policeEffect < +budget.MAX_POLICESTATION_EFFECT.value) {
      score = Math.round(score * (0.9 + budget.policeEffect / (10 * +budget.MAX_POLICESTATION_EFFECT.value)));
    }
    if (budget.fireEffect < +budget.MAX_FIRESTATION_EFFECT.value) {
      score = Math.round(score * (0.9 + budget.fireEffect / (10 * +budget.MAX_FIRESTATION_EFFECT.value)));
    }
    // Penalise the player by 15% if demand for any type of zone has collapsed due
    // to overprovision
    if (valves.resValve < -1000) {
      score = Math.round(score * demandPenalty);
    }

    if (valves.comValve < -1000) {
      score = Math.round(score * demandPenalty);
    }

    if (valves.indValve < -1000) {
      score = Math.round(score * demandPenalty);
    }
    let scale = 1.0;
    if (this.cityPop === 0 || this.cityPopDelta === 0 || this.cityPopDelta === this.cityPop) {
      scale = 1.0;
    } else if (this.cityPopDelta > 0) {
      scale = this.cityPopDelta / this.cityPop + 1.0;
    } else if (this.cityPopDelta < 0) {
      scale = 0.95 * Math.floor(this.cityPopDelta / (this.cityPop - this.cityPopDelta));
    }

    score = Math.round(score * scale);
    // Penalize player for having fires and a burdensome tax rate
    score = score - this.getFireSeverity(census) - budget.cityTax;
    // Penalize player based on ratio of unpowered zones to total zones
    scale = census.unpoweredZoneCount + census.poweredZoneCount;
    if (scale > 0) {
      score = Math.round(score * (census.poweredZoneCount / scale));
    }
    // Force in to range 0-1000. New score is average of last score and new computed value
    score = miscUtilsController.clamp(score, 0, 1000);
    this.cityScore = Math.round((this.cityScore + score) / 2);

    this.cityScoreDelta = this.cityScore - cityScoreLast;

    if (this.cityScoreDelta !== 0) {
      this._emitEvent(SCORE_UPDATED, this.cityScore);
    }
  },
  evalInit() {
    this.cityYes = 0;
    this.cityPop = 0;
    this.cityPopDelta = 0;
    this.cityAssessedValue = 0;
    this.cityClass = this.CC_VILLAGE.value;
    this.cityClassLast = this.CC_VILLAGE.value;
    this.cityScore = 500;
    this.cityScoreDelta = 0;
    for (var i = 0; i < this.NUMPROBLEMS; i++) this.problemVotes[i] = { index: i, voteCount: 0 };

    for (i = 0; i < this.NUM_COMPLAINTS; i++) {
      this.problemOrder[i] = this.NUMPROBLEMS;
    }
  },
  doVotes() {
    // Survey 100 voters on the mayor's performance
    this.cityYes = 0;
    for (let i = 0; i < 100; i++) {
      const voterExpectation = Random.getRandom(1000);
      if (this.cityScore > voterExpectation) {
        this.cityYes++;
      }
    }
  },
  getProblemNumber(value: number) {
    if (value < 0 || value >= this.NUM_COMPLAINTS) {
      return null;
    }
    return this.problemOrder[value];
  },
  getCityClass(cityPopulation: number) {
    this.cityClass = this.CC_VILLAGE.value;
    if (cityPopulation > 2000) {
      this.cityClass = this.CC_TOWN.value;
    }

    if (cityPopulation > 10000) {
      this.cityClass = this.CC_CITY.value;
    }
    if (cityPopulation > 50000) {
      this.cityClass = this.CC_CAPITAL.value;
    }
    if (cityPopulation > 100000) {
      this.cityClass = this.CC_METROPOLIS.value;
    }
    if (cityPopulation > 500000) {
      this.cityClass = this.CC_MEGALOPOLIS.value;
    }
    if (this.cityClass !== this.cityClassLast) {
      this.cityClassLast = this.cityClass;
      this._emitEvent(CLASSIFICATION_UPDATED, this.cityClass);
    }

    return this.cityClass;
  },
  save(saveData) {
    for (let i = 0, l = this.saveProps.length; i < l; i++) {
      saveData[this.saveProps[i]] = this[this.saveProps[i]];
    }
  },
  load(saveData) {
    for (let i = 0, l = this.saveProps.length; i < l; i++) {
      this[this.saveProps[i]] = saveData[this.saveProps[i]];
    }
  },
  _emitEvent(_event: string, _subject: Object) {
    //TODO EVENTEMITER
    return;
  },
};
