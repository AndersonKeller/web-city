import type { GameMap } from "../map/gameMap-ts";
import type { iMapScanner } from "../map/mapScanner-ts";
import { Random } from "../utils/random";
import type { iRepairManager } from "../manager/repairManager-ts";
import type { BlockMapSimulation, iSimulation } from "../simulation/simulation-ts";
import { ANIMBIT, ASCBIT, BNCNBIT } from "./tileFlags";

// import { TileUtils } from "./tileUtils";

import { trafficController } from "../simulation/traffic-ts";
import { zoneUtilsController } from "../utils/zoneUtils-ts";
import { tileUtilsController } from "./tileUtils-ts";
import { INDCLR, IZB } from "./tileValues";

export const industrialController = {
  animated: [true, false, true, true, false, false, true, true],
  xDelta: [-1, 0, 1, 0, 0, 0, 0, 1],
  yDelta: [-1, 0, -1, -1, 0, 0, -1, -1],
  getZonePopulation(_map: GameMap, _x: number, _y: number, tileValue: number): number {
    if (tileValue === INDCLR) {
      return 0;
    }

    return (Math.floor((tileValue - IZB) / 9) % 4) + 1;
  },
  placeIndustrial(map: GameMap, x: number, y: number, populationCategory: number, valueCategory: number, zonePower: boolean) {
    const centreTile = (valueCategory * 4 + populationCategory) * 9 + IZB;
    zoneUtilsController.putZone(map, x, y, centreTile, zonePower);
  },
  growZone(map: GameMap, x: number, y: number, blockMaps: BlockMapSimulation, population: number, valueCategory: number, zonePower: boolean) {
    if (population < 4) {
      this.placeIndustrial(map, x, y, population, valueCategory, zonePower);
      zoneUtilsController.incRateOfGrowth(blockMaps, x, y, 8);
    }
  },
  degradeZone(
    map: GameMap,
    x: number,
    y: number,
    blockMaps: BlockMapSimulation,
    populationCategory: number,
    valueCategory: number,
    zonePower: boolean,
  ) {
    if (populationCategory > 1) {
      this.placeIndustrial(map, x, y, populationCategory - 2, valueCategory, zonePower);
    } else {
      zoneUtilsController.putZone(map, x, y, INDCLR, zonePower);
    }
    zoneUtilsController.incRateOfGrowth(blockMaps, x, y, -8);
  },
  setAnimation(map: GameMap, x: number, y: number, tileValue: number, isPowered: boolean) {
    if (tileValue < IZB) {
      return;
    }
    const i = (tileValue - IZB) >> 3;
    if (this.animated[i] && isPowered) {
      map.addTileFlags(x + this.xDelta[i], y + this.yDelta[i], ASCBIT);
    } else {
      map.addTileFlags(x + this.xDelta[i], y + this.yDelta[i], BNCNBIT);

      // Ensure we drop the animation bit if we've only recently lost power
      map.removeTileFlags(x + this.xDelta[i], y + this.yDelta[i], ANIMBIT);
    }
  },
  // Called by the map scanner when it finds the centre of an industrial zone
  industrialFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.census.indZonePop += 1;
    // Calculate the population level for this tile, and add to census
    const tileValue = map.getTileValue(x, y);
    const population = this.getZonePopulation(map, x, y, tileValue);
    simData.census.indPop += population;

    // Set animation bit if appropriate
    const zonePower = map.getTile(x, y).isPowered();
    this.setAnimation(map, x, y, tileValue, zonePower);
    // Occasionally check to see if the zone is connected to the transport network (the chance of this happening
    // increases as the population increases). Growth naturally stalls if workers cannot reach the factories.
    // Note in particular, we will never take this branch if the zone is empty.
    let trafficOK = trafficController.ROUTE_FOUND;
    if (population > Random.getRandom(5)) {
      trafficOK = simData.trafficManager.makeTraffic(x, y, simData.blockMaps, tileUtilsController.isResidential);
      // Trigger outward migration if not connected to road network (unless the zone is already empty)
      if (trafficOK === trafficController.NO_ROAD_FOUND) {
        const newValue = Random.getRandom16() & 1;
        this.degradeZone(map, x, y, simData.blockMaps, population, newValue, zonePower);
        return;
      }
    }
    // Occasionally assess and perhaps modify the tile
    if (Random.getChance(7)) {
      let zoneScore = simData.valves.indValve + (trafficOK === trafficController.NO_ROAD_FOUND ? -1000 : 0);
      if (!zonePower) {
        zoneScore = -500;
      }
      // The industrial demand valve has range -1500 to 1500, so taking into account the "no traffic" and
      // "no power" modifiers above, zoneScore must lie in the range -3000 - 1500

      // First: observe that if there are no roads we will never take this branch, as zoneScore will be <= -1000.
      // Given the comment above about ranges for zoneScore, zoneScore - 26380, will be in the range -26729 to -24880.
      // getRandom16() has a range of 65536 possible numbers, in the range -32768 to 32767.
      // Of those, 9.2% will always be below zoneScore and hence will always take this branch and trigger zone growth.
      // 87.9% of them are above -24880, so nearly 88% of the time, we will never take this branch.
      // Thus, there's approximately a 2.9% chance that the value will be in the range, and we *might* grow.
      // This has the nice effect of not preventing an individual unit from growing even if overall demand has collapsed
      // (the business itself might still be growing.
      if (zoneScore > -350 && zoneScore - 26380 > Random.getRandom16Signed()) {
        this.growZone(map, x, y, simData.blockMaps, population, Random.getRandom16() & 1, zonePower);
        return;
      }
      // Again, given the  above, zoneScore + 26380 must lie in the range 23380 - 27880.
      // There is a 7.4% chance of getRandom16() always yielding a number > 27880 which would take this branch.
      // There is a 85.6% chance of the number being below 23380 thus never triggering this branch, which leaves a
      // 9% chance of this branch being conditional on zoneScore.
      if (zoneScore < 350 && zoneScore + 26380 < Random.getRandom16Signed()) {
        this.degradeZone(map, x, y, simData.blockMaps, population, Random.getRandom16() & 1, zonePower);
      }
    }
  },
  registerHandlers(mapScanner: iMapScanner, _repairmanager: iRepairManager) {
    const tileUtil = tileUtilsController;
    mapScanner.addAction(tileUtil.isIndustrialZone, this.industrialFound.bind(this));
  },
};