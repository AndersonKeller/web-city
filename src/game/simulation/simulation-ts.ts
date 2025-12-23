
import { budgetController, type iBudget } from "./budget-ts";
import { censusController, type iCensus } from "./census-ts";
import { disasterManagerController } from "../manager/disasterManager-ts.ts";
import { evaluationController, type iEvaluation } from "./evaluation-ts";
import type { GameMap } from "../map/gameMap-ts.ts";
import { mapScannerController } from "../map/mapScanner-ts.ts";
import { miscUtilsController } from "../utils/miscUtils-ts.ts";
import { powerManagerController, type iPowerManager } from "../manager/powerManager-ts.ts";
import { repairManagerController, type iRepairManager } from "../manager/repairManager-ts.ts";
import { spriteManagerController, type iSpriteManager } from "../sprites/spriteManager-ts.ts";
import { trafficController, type iTraffic } from "./traffic-ts";
import { valvesController, type iValves } from "./valves-ts";
import * as Messages from "../utils/messages.ts";
import { EventEmitter } from "../utils/eventEmitter-ts.ts";
import { commercialController } from "../tiles/commercial-ts.ts";
import { emergencyServicesController } from "./emergencyServices-ts";
import { industrialController } from "../tiles/industrial-ts.ts";
import { miscTilesController } from "../tiles/miscTiles-ts.ts";
import { residentialController } from "../tiles/residential-ts.ts";
import { roadController } from "../tiles/road-ts.ts";
import { stadiaController } from "./stadia-ts";
import { transportController } from "./transport-ts";
import { BlockMap } from "../map/blockMap.ts";
import { blockMapUtilsController } from "../map/blockMapUtils-ts.ts";

interface BudgetWhitEvent extends iBudget {
  addEventListener: (event: string, listeners: () => void) => void;
}
interface EvaluationWhitEvent extends iEvaluation {
  addEventListener: (event: string, listeners: () => void) => void;
}
interface PowerManagerWhitEvent extends iPowerManager {
  addEventListener: (event: string, listeners: () => void) => void;
}
interface ValvesWhitEvent extends iValves {
  comCap: boolean;
  indCap: boolean;
  resCap: boolean;
  addEventListener: (event: string, listeners: () => void) => void;
}
export interface SpritesWhitEvent extends iSpriteManager {
  addEventListener: (event: string, listeners: () => void) => void;
}

interface iSumilationTraffic extends iTraffic {}
export interface BlockMapSimulation {
  cityCentreDistScoreMap: BlockMap;

  // Holds a score representing how dangerous an area is, in range 0-250 (larger is worse)
  crimeRateMap: BlockMap;

  // A map used to note positions of fire stations during the map scan, range 0-1000
  fireStationMap: BlockMap;

  // Holds a value containing a score representing the effect of fire cover in this neighborhood, range 0-1000
  fireStationEffectMap: BlockMap;

  // Holds scores representing the land value in the range 0-250
  landValueMap: BlockMap;

  // A map used to note positions of police stations during the map scan, range 0-1000
  policeStationMap: BlockMap;

  // Holds a value containing a score representing how much crime is dampened in this block, range 0-1000
  policeStationEffectMap: BlockMap;

  // Holds a value representing the amount of pollution in a neighbourhood, in the range 0-255
  pollutionDensityMap: BlockMap;

  // Holds a value representing population density of a block, in the range 0-510
  populationDensityMap: BlockMap;

  // Holds a value representing the rate of growth of a neighbourhood in the range -200 to +200
  rateOfGrowthMap: BlockMap;

  // Scores a block on how undeveloped/unspoilt it is, range 0-240
  terrainDensityMap: BlockMap;

  // Scores the volume of traffic in this cluster, range 0-240
  trafficDensityMap: BlockMap;

  // Temporary maps
  tempMap1: BlockMap;
  tempMap2: BlockMap;
  tempMap3: BlockMap;
}
interface iTrafficSimulation extends iTraffic {}
export type iSimulation = typeof simulationController;
export const simulationController = {
  _map: null as GameMap,
  addEventListener: (_event: string, _subject?: Function) => {},
  LEVEL_EASY: 0,
  LEVEL_MED: 1,
  LEVEL_HARD: 2,
  SPEED_PAUSED: 0,
  SPEED_SLOW: 1,
  SPEED_MED: 2,
  SPEED_FAST: 3,
  _gameLevel: 1,
  _speed: 1,
  _phaseCycle: 0,
  _simCycle: 0,
  _cityTime: 0,
  _cityPopLast: 0,
  _messageLast: undefined,
  _startingYear: 1900,
  _cityYearLast: -1,
  _cityMonthLast: -1,
  _lastPowerMessage: null,
  evaluation: null as EvaluationWhitEvent,
  valves: null as ValvesWhitEvent,
  _valves: null as ValvesWhitEvent,
  budget: null as BudgetWhitEvent,
  census: null as iCensus,
  _census: null as iCensus,
  _powerManager: null as PowerManagerWhitEvent,
  spriteManager: null,
  _mapScanner: null as typeof mapScannerController,
  _repairManager: null as iRepairManager,
  _traffic: null as iSumilationTraffic,
  disasterManager: null,
  blockMaps: null as BlockMapSimulation,
  _lastTickTime: -1 as any,
  saveProps: ["_cityTime", "_speed", "_gameLevel"],
  _resLast: 0,
  _comLast: 0,
  _indLast: 0,
  speedPowerScan: [2, 4, 5],
  speedPollutionTerrainLandValueScan: [2, 7, 17],
  speedCrimeScan: [1, 8, 18],
  speedPopulationDensityScan: [1, 9, 19],
  speedFireAnalysis: [1, 10, 20],
  CENSUS_FREQUENCY_10: 4,
  CENSUS_FREQUENCY_120: 4 * 10,
  TAX_FREQUENCY: 48,
  trafficManager: null as iTrafficSimulation,
  create(gameMap: GameMap, gameLevel: number, speed: number, savedGame?: GameMap) {
    this._map = gameMap;

    this.setLevel(gameLevel);
    this.setSpeed(speed);

    this._phaseCycle = 0;
    this._simCycle = 0;
    this._cityTime = 0;
    this._cityPopLast = 0;
    this._messageLast = undefined;
    this._startingYear = 1900;

    // Last date sent to front end
    this._cityYearLast = -1;
    this._cityMonthLast = -1;

    // Last time we relayed a message from PowerManager to the front-end
    this._lastPowerMessage = null;
    // And now, the main cast of characters
    (this.evaluation = {
      ...evaluationController,
      addEventListener: () => {},
    }).create(gameLevel);
    (this._valves = {
      ...valvesController,
      addEventListener: () => {},
    }).create();
    ((this.valves = this._valves),
      (this.budget = {
        ...budgetController,
        addEventListener: () => {},
      }).create());
    this._census = censusController;
    this._census.create();
    ((this.census = this._census),
      (this._powerManager = {
        ...powerManagerController,
        addEventListener: () => {},
      }).create(this._map));
    (this.spriteManager = {
      ...spriteManagerController,
      addEventListener: () => {},
    }).create(this._map);
    this._mapScanner = mapScannerController.create(this._map);
    this._repairManager = repairManagerController.create(this._map);
    this._traffic = trafficController.create(this._map, this.spriteManager);
    (this.disasterManager = {
      ...disasterManagerController,
      addEventListener: () => {},
    }).create(this._map, this.spriteManager, gameLevel);

    this.blockMaps = {
      // Holds a "distance score" for the block from the city centre, range  -64 to 64
      cityCentreDistScoreMap: new BlockMap(this._map.width, this._map.height, 8),

      // Holds a score representing how dangerous an area is, in range 0-250 (larger is worse)
      crimeRateMap: new BlockMap(this._map.width, this._map.height, 2),

      // A map used to note positions of fire stations during the map scan, range 0-1000
      fireStationMap: new BlockMap(this._map.width, this._map.height, 8),

      // Holds a value containing a score representing the effect of fire cover in this neighborhood, range 0-1000
      fireStationEffectMap: new BlockMap(this._map.width, this._map.height, 8),

      // Holds scores representing the land value in the range 0-250
      landValueMap: new BlockMap(this._map.width, this._map.height, 2),

      // A map used to note positions of police stations during the map scan, range 0-1000
      policeStationMap: new BlockMap(this._map.width, this._map.height, 8),

      // Holds a value containing a score representing how much crime is dampened in this block, range 0-1000
      policeStationEffectMap: new BlockMap(this._map.width, this._map.height, 8),

      // Holds a value representing the amount of pollution in a neighbourhood, in the range 0-255
      pollutionDensityMap: new BlockMap(this._map.width, this._map.height, 2),

      // Holds a value representing population density of a block, in the range 0-510
      populationDensityMap: new BlockMap(this._map.width, this._map.height, 2),

      // Holds a value representing the rate of growth of a neighbourhood in the range -200 to +200
      rateOfGrowthMap: new BlockMap(this._map.width, this._map.height, 8),

      // Scores a block on how undeveloped/unspoilt it is, range 0-240
      terrainDensityMap: new BlockMap(this._map.width, this._map.height, 4),

      // Scores the volume of traffic in this cluster, range 0-240
      trafficDensityMap: new BlockMap(this._map.width, this._map.height, 2),

      // Temporary maps
      tempMap1: new BlockMap(this._map.width, this._map.height, 2),
      tempMap2: new BlockMap(this._map.width, this._map.height, 2),
      tempMap3: new BlockMap(this._map.width, this._map.height, 4),
    };

    this._clearCensus();
    if (savedGame) {
      this.load(savedGame);
    } else {
      this.budget.setFunds(20000);
      this._census.totalPop = 1;
    }

    this.init();
    EventEmitter(this);
    return this;
  },
  init() {
    this._lastTickTime = -1;

    // Add various listeners that we will in turn transmit upwards
    const evaluationEvents = ["CLASSIFICATION_UPDATED", "POPULATION_UPDATED", "SCORE_UPDATED"].map(function (m: string) {
      return Messages[m];
    });

    evaluationEvents.forEach((event: string) => {
      this.evaluation.addEventListener(event, miscUtilsController.reflectEvent.bind(this, event));
    });
    const self = this;
    this._powerManager.addEventListener(
      Messages.NOT_ENOUGH_POWER,
      function () {
        let d: any = new Date();
        if (self._lastPowerMessage === null || d - self._lastPowerMessage > 1000 * 60 * 2) {
          self._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NOT_ENOUGH_POWER,
          });
          self._lastPowerMessage = d;
        }
      }.bind(this),
    );

    this.budget.addEventListener(Messages.FUNDS_CHANGED, miscUtilsController.reflectEvent.bind(this, Messages.FUNDS_CHANGED));
    this.budget.addEventListener(Messages.BUDGET_NEEDED, miscUtilsController.reflectEvent.bind(this, Messages.BUDGET_NEEDED));
    this.budget.addEventListener(Messages.NO_MONEY, this._wrapMessage.bind(this, Messages.NO_MONEY));

    this._valves.addEventListener(Messages.VALVES_UPDATED, this._onValveChange.bind(this));

    for (let i = 0, l = Messages.DISASTER_MESSAGES.length; i < l; i++) {
      this.spriteManager.addEventListener(Messages.DISASTER_MESSAGES[i], this._wrapMessage.bind(this, Messages.DISASTER_MESSAGES[i]));
      this.disasterManager.addEventListener(Messages.DISASTER_MESSAGES[i], this._wrapMessage.bind(this, Messages.DISASTER_MESSAGES[i]));
    }
    for (let i = 0, l = Messages.CRASHES.length; i < l; i++) {
      this.spriteManager.addEventListener(Messages.CRASHES[i], this._wrapMessage.bind(this, Messages.CRASHES[i]));
    }
    this.spriteManager.addEventListener(Messages.HEAVY_TRAFFIC, this._wrapMessage.bind(this, Messages.HEAVY_TRAFFIC));

    // Register actions
    commercialController.registerHandlers(this._mapScanner, this._repairManager);
    emergencyServicesController.registerHandlers(this._mapScanner, this._repairManager);
    industrialController.registerHandlers(this._mapScanner, this._repairManager);
    miscTilesController.registerHandlers(this._mapScanner, this._repairManager);
    this._powerManager.registerHandlers(this._mapScanner, this._repairManager);
    roadController.registerHandlers(this._mapScanner, this._repairManager);
    residentialController.registerHandlers(this._mapScanner, this._repairManager);
    stadiaController.registerHandlers(this._mapScanner, this._repairManager);
    transportController.registerHandlers(this._mapScanner, this._repairManager);

    let simData = this._constructSimData();
    this.trafficManager = simData.trafficManager;
    this._mapScanner.mapScan(0, this._map.width, simData);
    this._powerManager.doPowerScan(this._census);
    blockMapUtilsController.pollutionTerrainLandValueScan(this._map, this._census, this.blockMaps);
    blockMapUtilsController.crimeScan(this._census, this.blockMaps);
    blockMapUtilsController.populationDensityScan(this._map, this.blockMaps);
    blockMapUtilsController.fireAnalysis(this.blockMaps);
  },
  isPaused() {
    return this._speed === this.SPEED_PAUSED;
  },
  _constructSimData() {
    return {
      blockMaps: this.blockMaps,
      budget: this.budget,
      census: this._census,
      cityTime: this._cityTime,
      disasterManager: this.disasterManager,
      gameLevel: this._gameLevel,
      repairManager: this._repairManager,
      powerManager: this._powerManager,
      simulator: this,
      spriteManager: this.spriteManager,
      trafficManager: this._traffic,
      valves: this._valves,
    };
  },
  save(saveData) {
    for (var i = 0, l = this.saveProps.length; i < l; i++) saveData[this.saveProps[i]] = this[this.saveProps[i]];

    this._map.save(saveData);
    this.evaluation.save(saveData);
    this._valves.save(saveData);
    this.budget.save(saveData);
    this._census.save(saveData);
  },
  _emitEvent(_event: string, _subject: Object) {
    //decorator for EventEmitter
    return;
  },
  _onValveChange() {
    this._resLast = this._valves.resValve;
    this._comLast = this._valves.comValve;
    this._indLast = this._valves.indValve;

    this._emitEvent(Messages.VALVES_UPDATED, {
      residential: this._valves.resValve,
      commercial: this._valves.comValve,
      industrial: this._valves.indValve,
    });
  },
  getDate(): { month: number; year: number } {
    const year = Math.floor(this._cityTime / 48) + this._startingYear;
    const month = Math.floor(this._cityTime % 48) >> 2;
    return {
      month,
      year,
    };
  },
  _setYear(year): void {
    if (year < this._startingYear) year = this._startingYear;
    year = year - this._startingYear - this._cityTime / 48;
    this._cityTime += year * 48;
    this._updateTime();
  },

  _updateTime() {
    const megalinium = 1000000;
    const cityYear = Math.floor(this._cityTime / 48) + this._startingYear;
    const cityMonth = Math.floor(this._cityTime % 48) >> 2;

    if (cityYear >= megalinium) {
      this._setYear(this._startingYear);
      return;
    }

    if (this._cityYearLast !== cityYear || this._cityMonthLast !== cityMonth) {
      this._cityYearLast = cityYear;
      this._cityMonthLast = cityMonth;
      this._emitEvent(Messages.DATE_UPDATED, {
        month: cityMonth,
        year: cityYear,
      });
    }
    // console.log("update time?");
  },
  _wrapMessage(message: string, data: Object) {
    this._emitEvent(Messages.FRONT_END_MESSAGE, {
      subject: message,
      data: data,
    });
  },
  load(saveData: GameMap) {
    for (var i = 0, l = this.saveProps.length; i < l; i++) this[this.saveProps[i]] = saveData[this.saveProps[i]];

    this._map.load(saveData);

    this.evaluation.load(saveData);
    this._valves.load(saveData);
    this.budget.load(saveData);
    this._census.load(saveData);
  },
  setLevel(gameLevel: number) {
    if (gameLevel !== this.LEVEL_EASY && gameLevel !== this.LEVEL_MED && gameLevel !== this.LEVEL_HARD) throw new Error("Invalid level!");

    this._gameLevel = gameLevel;
  },
  setSpeed(speed: number) {
    if (speed !== this.SPEED_PAUSED && speed !== this.SPEED_SLOW && speed !== this.SPEED_MED && speed !== this.SPEED_FAST)
      throw new Error("Invalid speed!");

    this._speed = speed;
  },
  _clearCensus() {
    this._census.clearCensus();
    this._powerManager.clearPowerStack();
    this.blockMaps.fireStationMap.clear();
    this.blockMaps.policeStationMap.clear();
  },
  simulate(simData) {
    this._phaseCycle &= 15;
    const speedIndex = this._speed - 1;

    switch (this._phaseCycle) {
      case 0:
        if (this._simCycle > 1023) {
          this._simCycle = 0;
        }
        this._cityTime++;
        if ((this._simCycle & 1) === 0) {
          this._valves.setValves(this._gameLevel, this._census, this.budget);
        }
        this._clearCensus();
        break;

      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        this._mapScanner.mapScan(((this._phaseCycle - 1) * this._map.width) / 8, (this._phaseCycle * this._map.width) / 8, simData);
        break;

      case 9:
        if (this._cityTime % this.CENSUS_FREQUENCY_10 === 0) {
          this._census.take10Census(this.budget);
        }
        if (this._cityTime % this.CENSUS_FREQUENCY_120 === 0) {
          // this._census.take120Census(this.budget);
          this._census.take120Census();
        }
        if (this._cityTime % this.TAX_FREQUENCY === 0) {
          this.budget.collectTax(this._gameLevel, this._census);
          this.evaluation.cityEvaluation({ ...simData, _census: this._census });
        }
        break;

      case 10:
        if (this._simCycle % 5 === 0) {
          blockMapUtilsController.neutraliseRateOfGrowthMap(simData.blockMaps);
        }
        blockMapUtilsController.neutraliseTrafficMap(this.blockMaps);
        this._sendMessages();
        break;

      case 11:
        if (this._simCycle % this.speedPowerScan[speedIndex] === 0) {
          this._powerManager.doPowerScan(this._census);
        }
        break;

      case 12:
        if (this._simCycle % this.speedPollutionTerrainLandValueScan[speedIndex] === 0) {
          blockMapUtilsController.pollutionTerrainLandValueScan(this._map, this._census, this.blockMaps);
        }
        break;
      case 13:
        if (this._simCycle % this.speedCrimeScan[speedIndex] === 0) blockMapUtilsController.crimeScan(this._census, this.blockMaps);
        break;

      case 14:
        if (this._simCycle % this.speedPopulationDensityScan[speedIndex] === 0)
          blockMapUtilsController.populationDensityScan(this._map, this.blockMaps);
        break;
      case 15:
        if (this._simCycle % this.speedFireAnalysis[speedIndex] === 0) blockMapUtilsController.fireAnalysis(this.blockMaps);

        this.disasterManager.doDisasters(this._census);
        break;
    }
    this._phaseCycle = (this._phaseCycle + 1) & 15;
  },
  _simulate(simData) {
    // This is actually a wrapper function that will only be called once, to perform the initial
    // evaluation. Once that has completed, it will supplant itself with the standard "simulate"
    // procedure defined above
    this.evaluation.cityEvaluation({ ...simData, _census: this._census });
    this._simulate = this.simulate;
    this._simulate(simData);
  },
  _sendMessages() {
    this._checkGrowth();
    let totalZonePop = this._census.resZonePop + this._census.comZonePop + this._census.indZonePop;
    let powerPop = this._census.nuclearPowerPop + this._census.coalPowerPop;

    switch (this._cityTime & 63) {
      case 1:
        if (Math.floor(totalZonePop / 4) >= this._census.resZonePop) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_MORE_RESIDENTIAL,
          });
        }
        break;

      case 5:
        if (Math.floor(totalZonePop / 8) >= this._census.comZonePop) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_MORE_COMMERCIAL,
          });
        }
        break;
      case 10:
        if (Math.floor(totalZonePop / 8) >= this._census.indZonePop) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_MORE_INDUSTRIAL,
          });
        }
        break;
      case 14:
        if (totalZonePop > 10 && totalZonePop * 2 > this._census.roadTotal) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_MORE_ROADS,
          });
        }
        break;

      case 18:
        if (totalZonePop > 50 && totalZonePop > this._census.railTotal) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_MORE_RAILS,
          });
        }
        break;
      case 22:
        if (totalZonePop > 10 && powerPop === 0) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_ELECTRICITY,
          });
        }
        break;
      case 26:
        if (this._census.resPop > 500 && this._census.stadiumPop === 0) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_STADIUM,
          });
          this._valves.resCap = true;
        } else {
          this._valves.resCap = false;
        }
        break;
      case 28:
        if (this._census.indPop > 70 && this._census.seaportPop === 0) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_SEAPORT,
          });
          this._valves.indCap = true;
        } else {
          this._valves.indCap = false;
        }
        break;
      case 30:
        if (this._census.comPop > 100 && this._census.airportPop === 0) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_AIRPORT,
          });
          this._valves.comCap = true;
        } else {
          this._valves.comCap = false;
        }
        break;

      case 32:
        const zoneCount = this._census.unpoweredZoneCount + this._census.poweredZoneCount;
        if (zoneCount > 0) {
          if (this._census.poweredZoneCount / zoneCount < 0.7 && powerPop > 0) {
            const d: any = new Date();
            if (this._lastPowerMessage === null || d - this._lastPowerMessage > 1000 * 60 * 2) {
              this._emitEvent(Messages.FRONT_END_MESSAGE, {
                subject: Messages.BLACKOUTS_REPORTED,
              });
              this._lastPowerMessage = d;
            }
          }
        }
        break;

      case 35:
        if (this._census.pollutionAverage > 60) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.HIGH_POLLUTION,
            data: { x: this._map.pollutionMaxX, y: this._map.pollutionMaxY },
          });
        }
        break;

      case 42:
        if (this._census.crimeAverage > 100) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.HIGH_CRIME,
          });
        }
        break;
      case 45:
        if (this._census.totalPop > 60 && this._census.fireStationPop === 0) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_FIRE_STATION,
          });
        }
        break;
      case 48:
        if (this._census.totalPop > 60 && this._census.policeStationPop === 0) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.NEED_POLICE_STATION,
          });
        }
        break;

      case 51:
        if (this.budget.cityTax > 12) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.TAX_TOO_HIGH,
          });
        }
        break;
      case 54:
        if (this.budget.roadEffect < Math.floor((5 * this.budget.roadEffect) / 8) && this._census.roadTotal > 30) {
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.ROAD_NEEDS_FUNDING,
          });
        }
        break;

      case 57:
        if (this.budget.fireEffect < Math.floor((7 * this.budget.fireEffect) / 10) && this._census.totalPop > 20)
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.FIRE_STATION_NEEDS_FUNDING,
          });
        break;

      case 60:
        if (this.budget.policeEffect < Math.floor((7 * this.budget.policeEffect) / 10) && this._census.totalPop > 20)
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.POLICE_NEEDS_FUNDING,
          });
        break;

      case 63:
        if (this._census.trafficAverage > 60)
          this._emitEvent(Messages.FRONT_END_MESSAGE, {
            subject: Messages.TRAFFIC_JAMS,
          });
        break;
    }
  },
  _checkGrowth() {
    if ((this._cityTime & 3) !== 0) {
      return;
    }
    let message = "";
    let cityPop = this.evaluation.getPopulation(this._census);
    if (cityPop !== this._cityPopLast) {
      const lastClass = this.evaluation.getCityClass(this._cityPopLast);
      const newClass = this.evaluation.getCityClass(cityPop);
      if (lastClass !== newClass) {
        switch (newClass) {
          case evaluationController.CC_VILLAGE.value:
            break;
          case evaluationController.CC_TOWN.value:
            message = Messages.REACHED_TOWN;
            break;

          case evaluationController.CC_CITY.value:
            message = Messages.REACHED_CITY;
            break;

          case evaluationController.CC_CAPITAL.value:
            message = Messages.REACHED_CAPITAL;
            break;

          case evaluationController.CC_METROPOLIS.value:
            message = Messages.REACHED_METROPOLIS;
            break;

          case evaluationController.CC_MEGALOPOLIS.value:
            message = Messages.REACHED_MEGALOPOLIS;
            break;

          default:
            break;
        }
      }
    }
    if (message !== "" && message !== this._messageLast) {
      this._emitEvent(Messages.FRONT_END_MESSAGE, { subject: message });
      this._messageLast = message;
    }
    this._cityPopLast = cityPop;
  },
  simTick() {
    this._simFrame();
    this._updateTime();
  },
  _simFrame() {
    if (this.budget.awaitingValues) return;

    // Default to slow speed
    var threshold = 100;
    switch (this._speed) {
      case this.SPEED_PAUSED:
        return;

      case this.SPEED_SLOW:
        break;

      case this.SPEED_MED:
        threshold = 50;
        break;

      case this.SPEED_FAST:
        threshold = 10;
        break;
      default:
        console.warn("Unexpected speed (" + this._speed + "): defaulting to slow");
    }
    const d: any = new Date();
    if (d - this._lastTickTime < threshold) return;

    const simData = this._constructSimData();
    this._simulate(simData);
    this._lastTickTime = new Date();
  },
};
