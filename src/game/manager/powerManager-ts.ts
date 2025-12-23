import { BlockMap } from "../map/blockMap";
import type { iCensus } from "../simulation/census-ts";
import { forEachCardinalDirection, type Direction } from "../utils/direction";
import { EventEmitter } from "../utils/eventEmitter-ts";
import type { GameMap } from "../map/gameMap-ts";
import type { iMapScanner } from "../map/mapScanner-ts";
import { NOT_ENOUGH_POWER } from "../utils/messages";
import { Position } from "../utils/position";
import { Random } from "../utils/random";
import type { iRepairManager } from "./repairManager-ts";
import type { iSimulation } from "../simulation/simulation-ts";
import { ANIMBIT, BURNBIT, CONDBIT, POWERBIT } from "../tiles/tileFlags";
import { NUCLEAR, POWERPLANT } from "../tiles/tileValues";

export type iPowerManager = typeof powerManagerController;

export const powerManagerController = {
  COAL_POWER_STRENGTH: 700,
  NUCLEAR_POWER_STRENGTH: 2000,
  _map: null as GameMap,
  _powerStack: [] as Position[],
  powerGridMap: null as BlockMap,
  _powerStackPointer: 0,
  dX: [1, 2, 1, 2],
  dY: [-1, -1, 0, 0],
  meltdownTable: [30000, 20000, 10000],
  create(map) {
    this._map = map;
    this.powerGridMap = new BlockMap(this._map.width, this._map.height, 1);
    EventEmitter(this);
    return this;
  },
  setTilePower(x: number, y: number) {
    const tile = this._map.getTile(x, y);
    const tileValue = tile.getValue();

    if (tileValue === NUCLEAR || tileValue === POWERPLANT || this.powerGridMap.worldGet(x, y) > 0) {
      tile.addFlags(POWERBIT);
      return;
    }

    tile.removeFlags(POWERBIT);
  },
  clearPowerStack() {
    this._powerStackPointer = 0;
    this._powerStack = [];
  },
  testForConductive(position: Position, testDir: Direction) {
    const movedPos = Position.move(position, testDir);

    if (this._map.isPositionInBounds(movedPos)) {
      if (this._map.getTile(movedPos.x, movedPos.y).isConductive()) {
        if (this.powerGridMap.worldGet(movedPos.x, movedPos.y) === 0) {
          return true;
        }
      }
    }
    return false;
  },
  // Note: the algorithm is buggy: if you have two adjacent power
  // plants, the second will be regarded as drawing power from the first
  // rather than as a power source itself
  doPowerScan(census: iCensus) {
    this.powerGridMap.clear();
    // Power that the combined coal and nuclear power plants can deliver.
    const maxPower = census.coalPowerPop * this.COAL_POWER_STRENGTH + census.nuclearPowerPop * this.NUCLEAR_POWER_STRENGTH;

    let powerConsumption = 0; // Amount of power used.
    while (this._powerStack.length > 0) {
      let pos = this._powerStack.pop();
      let anyDir = undefined;
      let conNum;
      do {
        powerConsumption++;
        if (powerConsumption > maxPower) {
          this._emitEvent(NOT_ENOUGH_POWER);
          return;
        }
        if (anyDir) {
          pos = Position.move(pos, anyDir);
        }
        this.powerGridMap.worldSet(pos.x, pos.y, 1);
        conNum = 0;
        forEachCardinalDirection((dir) => {
          if (conNum >= 2) {
            return;
          }
          if (this.testForConductive(pos, dir)) {
            conNum++;
            anyDir = dir;
          }
        });
        if (conNum > 1) {
          this._powerStack.push(new Position(pos.x, pos.y));
        }
      } while (conNum);
    }
  },
  coalPowerFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.census.coalPowerPop += 1;
    this._powerStack.push(new Position(x, y));
    // Ensure animation runs
    const dX = [-1, 2, 1, 2];
    const dY = [-1, -1, 0, 0];
    for (var i = 0; i < 4; i++) {
      map.addTileFlags(x + dX[i], y + dY[i], ANIMBIT);
    }
  },
  nuclearPowerFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    if (simData.disasterManager.disastersEnabled && Random.getRandom(this.meltdownTable[simData._gameLevel]) === 0) {
      simData.disasterManager.doMeltdown(x, y);
      return;
    }
    simData.census.nuclearPowerPop += 1;
    this._powerStack.push(new Position(x, y));

    // Ensure animation bits set
    for (var i = 0; i < 4; i++) {
      map.addTileFlags(x, y, ANIMBIT | CONDBIT | POWERBIT | BURNBIT);
    }
  },
  registerHandlers(mapScanner: iMapScanner, repairManager: iRepairManager) {
    mapScanner.addAction(POWERPLANT, this.coalPowerFound.bind(this));
    mapScanner.addAction(NUCLEAR, this.nuclearPowerFound.bind(this));
    repairManager.addAction(POWERPLANT, 7, 4);
    repairManager.addAction(NUCLEAR, 7, 4);
  },
  _emitEvent(event: string, subject?: Object) {
    //todo emitEveent
    return;
  },
};
