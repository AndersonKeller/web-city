import type { GameMap } from "../map/gameMap-ts";
import type { iMapScanner } from "../map/mapScanner-ts";
import { Random } from "../utils/random";
import type { iRepairManager } from "../manager/repairManager-ts";
import type { BlockMapSimulation, iSimulation } from "../simulation/simulation-ts";
import { tileUtilsController } from "./tileUtils-ts";
// import { TileUtils } from "./tileUtils";
import { COMCLR, CZB } from "./tileValues";
import { trafficController } from "../simulation/traffic-ts";
import { zoneUtilsController } from "../utils/zoneUtils-ts";

export type iCommercial = typeof commercialController;
export const commercialController = {
  tileUtils: tileUtilsController,
  getZonePopulation(_map: GameMap, _x: number, _y: number, tileValue: number) {
    if (tileValue === COMCLR) {
      return 0;
    }
    return (Math.floor((tileValue - CZB) / 9) % 5) + 1;
  },
  // Takes a map and coordinates, a population category in the range 1-5, a value category in the range 0-3, and places
  // the appropriate industrial zone on the map
  placeCommercial(map: GameMap, x: number, y: number, population: number, lpValue: number, zonePower: boolean) {
    const centreTile = (lpValue * 5 + population) * 9 + CZB;
    zoneUtilsController.putZone(map, x, y, centreTile, zonePower);
  },
  // landValueMap contains values in the range 0-250, representing the desirability of the land.
  // Thus, after shifting, landValue will be in the range 0-7.
  growZone(map: GameMap, x: number, y: number, blockMaps: BlockMapSimulation, population: number, lpValue: number, zonePower: boolean) {
    let landValue = blockMaps.landValueMap.worldGet(x, y);
    landValue = landValue >> 5;
    if (population > landValue) {
      return;
    }
    // This zone is desirable, and seemingly not to crowded. Switch to the next category of zone.
    if (population < 5) {
      this.placeCommercial(map, x, y, population, lpValue, zonePower);
      zoneUtilsController.incRateOfGrowth(blockMaps, x, y, 8);
    }
  },
  // Note that we special case empty zones here, rather than having to check population value on every
  // call to placeIndustrial (which we anticipate will be called more often)
  degradeZone(map: GameMap, x: number, y: number, blockMaps: BlockMapSimulation, populationCategory: number, lpCategory: number, zonePower: boolean) {
    if (populationCategory > 1) {
      this.placeCommercial(map, x, y, populationCategory - 2, lpCategory, zonePower);
    } else {
      zoneUtilsController.putZone(map, x, y, COMCLR, zonePower);
    }
    zoneUtilsController.incRateOfGrowth(blockMaps, x, y, -8);
  },
  // Called by the map scanner when it finds the centre of an commercial zone
  commercialFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    // lpValue will be filled if we actually decide to trigger growth/decay. It will be an index of the land/pollution
    // value in the range 0-3
    let lpValue;
    // Notify the census
    simData.census.comZonePop += 1;

    // Calculate the population level for this tile, and add to census
    const tileValue = map.getTileValue(x, y);
    const population = this.getZonePopulation(map, x, y, tileValue);

    simData.census.comPop += population;

    const zonePower = map.getTile(x, y).isPowered();
    // Occasionally check to see if the zone is connected to the transport network (the chance of this happening
    // increases as the population increases). Growth naturally stalls if consumers cannot reach the shops.
    // Note in particular, we will never take this branch if the zone is empty.
    let trafficOK = trafficController.ROUTE_FOUND;
    if (population > Random.getRandom(5)) {
      // Try to find a route from here to an industrial zone
      trafficOK = simData.trafficManager.makeTraffic(x, y, simData.blockMaps, this.tileUtils.isIndustrial);
      // Trigger outward migration if not connected to road network
      if (trafficOK === trafficController.NO_ROAD_FOUND) {
        lpValue = zoneUtilsController.getLandPollutionValue(simData.blockMaps, x, y);
        this.degradeZone(map, x, y, simData.blockMaps, population, lpValue, zonePower);
        return;
      }
    }
    // Occasionally assess and perhaps modify the tile
    if (Random.getChance(7)) {
      const locationScore = trafficOK === trafficController.NO_ROAD_FOUND ? -3000 : simData.blockMaps.cityCentreDistScoreMap.worldGet(x, y);
      let zoneScore = simData.valves.comValve + locationScore;
      // Unpowered zones should of course be penalized
      if (!zonePower) {
        zoneScore = -500;
      }
      // The commercial demand valve has range -1500 to 1500, so taking into account the "no traffic" and
      // "no power" modifiers above, zoneScore must lie in the range -5064 - 1564. (The comRateMap, which scores
      // commercial neighbourhoods based on their distance from the city centre, has range -64 to 64).

      // First: observe that if there are no roads we will never take this branch, as zoneScore will be <= -3000.
      // Given the comment above about ranges for zoneScore, zoneScore - 26380, will be in the range -26729 to -24816.
      // getRandom16() has a range of 65536 possible numbers, in the range -32768 to 32767.
      // Of those, 9.2% will always be below zoneScore and hence will always take this branch and trigger zone growth.
      // 87.8% of them are above -24816, so nearly 88% of the time, we will never take this branch.
      // Thus, there's approximately a 3% chance that the value will be in the range, and we *might* grow.
      // This has the nice effect of not preventing an individual unit from growing even if overall demand has collapsed
      // (the business itself might still be growing.
      if (zonePower && zoneScore > -350 && zoneScore - 26380 > Random.getRandom16Signed()) {
        lpValue = zoneUtilsController.getLandPollutionValue(simData.blockMaps, x, y);
        this.growZone(map, x, y, simData.blockMaps, population, lpValue, zonePower);
        return;
      }
      // Again, given the  above, zoneScore + 26380 must lie in the range 21316 - 27944.
      // There is a 7.3% chance of getRandom16() always yielding a number > 27994 which would take this branch.
      // There is a 82.5% chance of the number being below 21316 thus never triggering this branch, which leaves a
      // 10.1% chance of this branch being conditional on zoneScore.
      if (zoneScore < 350 && zoneScore + 26380 < Random.getRandom16Signed()) {
        lpValue = zoneUtilsController.getLandPollutionValue(simData.blockMaps, x, y);
        this.degradeZone(map, x, y, simData.blockMaps, population, lpValue, zonePower);
      }
    }
  },
  registerHandlers(mapScanner: iMapScanner, _repairManager: iRepairManager) {
    this.tileUtils = tileUtilsController;
    mapScanner.addAction(this.tileUtils.isCommercialZone, this.commercialFound.bind(this));
  },
};
