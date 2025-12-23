import type { GameMap } from "../map/gameMap-ts.ts";
import type { iMapScanner } from "../map/mapScanner-ts.ts";
import { Random } from "../utils/random.ts";
import type { iRepairManager } from "../manager/repairManager-ts.ts";
import type { BlockMapSimulation, iSimulation } from "../simulation/simulation-ts.ts";

import { BLBNCNBIT, ZONEBIT } from "./tileFlags";
import { tileUtilsController } from "./tileUtils-ts.ts";
// import { TileUtils } from "./tileUtils.js";
import * as TileValues from "./tileValues.ts";
import { trafficController } from "../simulation/traffic-ts.ts";
import { zoneUtilsController } from "../utils/zoneUtils-ts.ts";
export const residentialController = {
  freeZone: [0, 3, 6, 1, 4, 7, 2, 5, 8],
  // Residential tiles have 'populations' of 16, 24, 32 or 40, and value from 0 to 3. The tiles are laid out in
  // increasing order of land value, cycling through each population value
  placeResidential(map: GameMap, x: number, y: number, population: number, lpValue: number, zonePower: boolean) {
    const centreTile = (lpValue * 4 + population) * 9 + TileValues.RZB;

    zoneUtilsController.putZone(map, x, y, centreTile, zonePower);
  },
  // Look for housing in the adjacent 8 tiles
  getFreeZonePopulation(map: GameMap, x: number, y: number, tileValue: number) {
    let count = 0;
    for (let xx = x - 1; xx <= x + 1; xx++) {
      for (let yy = y - 1; yy <= y + 1; yy++) {
        if (xx === x && yy === y) continue;
        tileValue = map.getTileValue(xx, yy);
        if (tileValue >= TileValues.LHTHR && tileValue <= TileValues.HHTHR) {
          count += 1;
        }
      }
    }
    return count;
  },
  getZonePopulation(map: GameMap, x: number, y: number, tileValue: number) {
    // if(tileValue instanceof Tile){
    //     //tileValue = ti
    // }
    if (tileValue === TileValues.FREEZ) {
      return this.getFreeZonePopulation(map, x, y, tileValue);
    }
    const populationIndex = (Math.floor((tileValue - TileValues.RZB) / 9) % 4) + 1;
    return populationIndex * 8 + 16;
  },
  // Assess a tile for suitability for a house. Prefers tiles near roads
  evalLot(map: GameMap, x: number, y: number) {
    const xDelta = [0, 1, 0, -1];
    const yDelta = [-1, 0, 1, 0];
    if (!map.testBounds(x, y)) {
      return -1;
    }
    let tilevalue = map.getTileValue(x, y);
    if (tilevalue < TileValues.RESBASE || tilevalue > TileValues.RESBASE + 8) {
      return -1;
    }
    let score = 1;
    for (let i = 0; i < 4; i++) {
      const edgeX = x + xDelta[i];
      const edgeY = y + yDelta[i];
      if (edgeX < 0 || edgeX >= map.width || edgeY < 0 || edgeY >= map.height) {
        continue;
      }
      tilevalue = map.getTileValue(edgeX, edgeY);
      if (tilevalue !== TileValues.DIRT && tilevalue <= TileValues.LASTROAD) {
        score += 1;
      }
    }
    return score;
  },
  buildHouse(map: GameMap, x: number, y: number, lpValue: number) {
    let best = 0;
    let bestScore = 0;
    //  Deliberately ordered so that the centre tile is at index 0
    const xDelta = [0, -1, 0, 1, -1, 1, -1, 0, 1];
    const yDelta = [0, -1, -1, -1, 0, 0, 1, 1, 1];
    for (let i = 0; i < 9; i++) {
      const xx = x + xDelta[i];
      const yy = y + yDelta[i];
      let score = this.evalLot(map, xx, yy);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      } else if (score === bestScore && Random.getChance(7)) {
        // Ensures we don't always select the same position when we
        // have a choice
        best = i;
      }
    }
    if (best > 0 && map.testBounds(x + xDelta[best], y + yDelta[best])) {
      map.setTile(x + xDelta[best], y + yDelta[best], TileValues.HOUSE + Random.getRandom(2) + lpValue * 3, BLBNCNBIT);
    }
  },
  growZone(map: GameMap, x: number, y: number, blockMaps: BlockMapSimulation, population: number, lpValue: number, zonePower: boolean) {
    const pollution = blockMaps.pollutionDensityMap.worldGet(x, y);
    // Cough! Too polluted! No-one wants to move here!

    if (pollution > 128) {
      return;
    }
    const tileValue = map.getTileValue(x, y);

    if (tileValue === TileValues.FREEZ) {
      if (population < 8) {
        // Zone capacity not yet reached: build another house
        this.buildHouse(map, x, y, lpValue);
        zoneUtilsController.incRateOfGrowth(blockMaps, x, y, 1);
      } else if (blockMaps.populationDensityMap.worldGet(x, y) > 64) {
        // There is local demand for higher density housing

        this.placeResidential(map, x, y, 0, lpValue, zonePower);
        zoneUtilsController.incRateOfGrowth(blockMaps, x, y, 8);
      }
      return;
    }
    if (population < 40) {
      // Zone population not yet maxed out
      this.placeResidential(map, x, y, Math.floor(population / 8) - 1, lpValue, zonePower);
      zoneUtilsController.incRateOfGrowth(blockMaps, x, y, 8);
    }
  },
  degradeZone(map: GameMap, x: number, y: number, blockMaps: BlockMapSimulation, population: number, lpValue: number, zonePower: boolean) {
    let xx, yy;
    if (population === 0) {
      return;
    }
    if (population > 16) {
      this.placeResidential(map, x, y, Math.floor((population - 24) / 8), lpValue, zonePower);
      zoneUtilsController.incRateOfGrowth(blockMaps, x, y, -8);
      return;
    }
    if (population === 16) {
      map.setTile(x, y, TileValues.FREEZ, BLBNCNBIT | ZONEBIT);
      for (yy = y - 1; yy <= y + 1; yy++) {
        for (xx = x - 1; xx <= x + 1; xx++) {
          if (xx === x && yy === y) {
            continue;
          }
          map.setTile(x, y, TileValues.LHTHR + lpValue + Random.getRandom(2), BLBNCNBIT);
        }
      }
      zoneUtilsController.incRateOfGrowth(blockMaps, x, y, -8);
      return;
    }
    // Already down to individual houses. Remove one
    let i = 0;
    zoneUtilsController.incRateOfGrowth(blockMaps, x, y, -1);
    for (xx = x - 1; xx <= x + 1; xx++) {
      for (yy = y - 1; yy <= y + 1; yy++, i++) {
        var currentValue = map.getTileValue(xx, yy);
        if (currentValue >= TileValues.LHTHR && currentValue <= TileValues.HHTHR) {
          // We've found a house. Replace it with the normal free zone tile
          map.setTile(xx, yy, this.freeZone[i] + TileValues.RESBASE, BLBNCNBIT);
          return;
        }
      }
    }
  },
  // Returns a score for the zone in the range -3000 - 3000
  evalResidential(
    blockMaps: BlockMapSimulation,
    x: number,
    y: number,
    traffic: {
      configurable: boolean;
      enumerable: boolean;
      writeable: boolean;
      value: any;
    },
  ) {
    if (traffic === trafficController.NO_ROAD_FOUND) {
      return -3000;
    }
    let landValue = blockMaps.landValueMap.worldGet(x, y);
    landValue -= blockMaps.pollutionDensityMap.worldGet(x, y);
    if (landValue < 0) {
      landValue = 0;
    } else {
      landValue = Math.min(landValue * 32, 6000);
    }
    return landValue - 3000;
  },
  residentialFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    // If we choose to grow this zone, we will fill it with an index in the range 0-3 reflecting the land value and
    // pollution scores (higher is better). This is then used to select the variant to build

    let lpValue;
    // Notify the census
    simData.census.resZonePop += 1;
    // Also, notify the census of our population
    const tileValue = map.getTileValue(x, y);
    const population = this.getZonePopulation(map, x, y, tileValue);
    simData.census.resPop += population;

    const zonePower = map.getTile(x, y).isPowered();

    let trafficOK = trafficController.ROUTE_FOUND;
    // Occasionally check to see if the zone is connected to the road network. The chance of this happening increases
    // as the zone's population increases. Note: we will never execute this conditional if the zone is empty, as zero
    // will never be be bigger than any of the values Random will generate
    if (population > Random.getRandom(35)) {
      trafficOK = simData.trafficManager.makeTraffic(x, y, simData.blockMaps, tileUtilsController.isCommercial);
      // If we're not connected to the road network, then going shopping will be a pain. Move out.
      if (trafficOK === trafficController.NO_ROAD_FOUND) {
        lpValue = zoneUtilsController.getLandPollutionValue(simData.blockMaps, x, y);
        this.degradeZone(map, x, y, simData.blockMaps, population, lpValue, zonePower);
        return;
      }
    }
    // Sometimes we will randomly choose to assess this block. However, always assess it if it's empty or contains only
    // single houses.
    if (tileValue === TileValues.FREEZ || Random.getChance(7)) {
      // First, score the individual zone. This is a value in the range -3000 to 3000
      // Then take into account global demand for housing.
      let locationScore = this.evalResidential(simData.blockMaps, x, y, trafficOK);

      let zoneScore = simData.valves.resValve + locationScore;
      // Naturally unpowered zones should be penalized
      if (!zonePower) {
        zoneScore = -500;
      }
      // The residential demand valve has range -2000 to 2000, so taking into account the "no traffic" and
      // "no power" modifiers above, zoneScore must lie in the range -5500 - 5000.

      // Now, observe that if there are no roads we will never take this branch, as zoneScore will equal -3000.
      // Given the comment above about ranges for zoneScore, zoneScore - 26380, will be in the range -26729 to -20880.
      // getRandom16() has a range of 65536 possible numbers, in the range -32768 to 32767.
      // Of those, 9.2% will always be below zoneScore and hence will always take this branch and trigger zone growth.
      // 81.8% of them are above -20880, so nearly 82% of the time, we will never take this branch.
      // Thus, there's approximately a 9% chance that the value will be in the range, and we *might* grow.
      if (zoneScore > -350 && zoneScore - 26380 > Random.getRandom16Signed()) {
        // If this zone is empty, and residential demand is strong, we might make a hospital
        if (population === 0 && Random.getChance(3)) {
          this.makeHospital(map, x, y, simData, zonePower);
          return;
        }

        // Get an index in the range 0-3 scoring the land desirability and pollution, and grow the zone to the next
        // population rank
        lpValue = zoneUtilsController.getLandPollutionValue(simData.blockMaps, x, y);
        this.growZone(map, x, y, simData.blockMaps, population, lpValue, zonePower);
        return;
      }
      // Again, given the above, zoneScore + 26380 must lie in the range 20880 - 26030.
      // There is a 10.2% chance of getRandom16() always yielding a number > 27994 which would take this branch.
      // There is a 89.7% chance of the number being below 20880 thus never triggering this branch, which leaves a
      // 0.1% chance of this branch being conditional on zoneScore.
      if (zoneScore < 350 && zoneScore + 26380 < Random.getRandom16Signed()) {
        // Get an index in the range 0-3 scoring the land desirability and pollution, and degrade to the next
        // lower ranked zone

        lpValue = zoneUtilsController.getLandPollutionValue(simData.blockMaps, x, y);
        this.degradeZone(map, x, y, simData.blockMaps, population, lpValue, zonePower);
      }
    }
  },
  makeHospital(map: GameMap, x: number, y: number, simData: iSimulation, zoPower: boolean) {
    // We only build a hospital if the population requires it
    if (simData.census.needHospital > 0) {
      zoneUtilsController.putZone(map, x, y, TileValues.HOSPITAL, zoPower);
      simData.census.needHospital = 0;
      return;
    }
  },
  hospitalFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.census.hospitalPop += 1;
    if (simData.census.needHospital === -1) {
      if (Random.getRandom(20) === 0) {
        zoneUtilsController.putZone(map, x, y, TileValues.FREEZ, map.getTile(x, y).isPowered());
      }
    }
  },
  registerHandlers(mapScanner: iMapScanner, repairManager: iRepairManager) {
    const tileUtils = tileUtilsController;
    mapScanner.addAction(tileUtils.isResidentialZone, this.residentialFound.bind(this));
    mapScanner.addAction(TileValues.HOSPITAL, this.hospitalFound.bind(this));
    repairManager.addAction(TileValues.HOSPITAL, 15, 3);
  },
};