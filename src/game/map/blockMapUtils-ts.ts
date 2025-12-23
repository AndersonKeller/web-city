import type { BlockMap } from "./blockMap.ts";

import { Random } from "../utils/random.ts";

import type { iCensus } from "../simulation/census-ts.ts";
import { commercialController } from "../tiles/commercial-ts.ts";
import { industrialController } from "../tiles/industrial-ts.ts";
import { residentialController } from "../tiles/residential-ts.ts";
import { miscUtilsController } from "../utils/miscUtils-ts.ts";
import type { GameMap } from "./gameMap-ts.ts";
import * as TileValues from "../tiles/tileValues.ts";
import type { BlockMapSimulation } from "../simulation/simulation-ts.ts";
export const blockMapUtilsController = {
  SMOOTH_NEIGHBOURS_THEN_BLOCK: 0,
  SMOOTH_ALL_THEN_CLAMP: 1,
  // Smooth the map src into dest. The way in which the map is smoothed depends on the value of smoothStyle.
  // The meanings are as follows:
  //
  // SMOOTH_NEIGHBOURS_THEN_BLOCK
  // ============================
  // For each square in src, sum the values of its immediate neighbours, and take the average, then take the average of
  // that result and the square's value. This result is the new value of the square in dest.
  //
  // SMOOTH_ALL_THEN_CLAMP
  // =====================
  // For each square in src, sum the values of that square and it's four immediate neighbours, and take an average
  // rounding down. Clamp the resulting value in the range 0-255. This clamped value is the square's new value in dest.
  smoothMap(src: BlockMap, dest: BlockMap, smoothStyle: number) {
    const width = src.width;
    const height = src.height;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let edges = 0;
        if (x > 0) {
          edges += src.get(x - 1, y);
        }
        if (x < src.width - 1) {
          edges += src.get(x + 1, y);
        }
        if (y > 0) {
          edges += src.get(x, y + 1);
        }
        if (smoothStyle === this.SMOOTH_NEIGHBOURS_THEN_BLOCK) {
          edges = src.get(x, y) + Math.floor(edges / 4);
          dest.set(x, y, Math.floor(edges / 2));
        } else {
          edges = (edges + src.get(x, y)) >> 2;
          if (edges > 255) {
            edges = 255;
          }
          dest.set(x, y, edges);
        }
      }
    }
  },
  // Over time, the rate of growth of a neighbourhood should trend towards zero (stable)
  neutraliseRateOfGrowthMap(blockMaps: BlockMapSimulation) {
    const rateOfGrowthMap = blockMaps.rateOfGrowthMap;
    const width = rateOfGrowthMap.width;
    const height = rateOfGrowthMap.height;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let rate = rateOfGrowthMap.get(x, y);
        if (rate === 0) {
          continue;
        }
        if (rate > 0) {
          rate--;
        } else {
          rate++;
        }
        rate = miscUtilsController.clamp(rate, -200, 200);
        rateOfGrowthMap.set(x, y, rate);
      }
    }
  },
  // Over time, traffic density should ease.
  neutraliseTrafficMap(blockMaps: BlockMapSimulation) {
    const trafficDensityMap = blockMaps.trafficDensityMap;
    const width = trafficDensityMap.width;
    const height = trafficDensityMap.height;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let trafficDensity = trafficDensityMap.get(x, y);
        if (trafficDensity === 0) {
          continue;
        }
        if (trafficDensity <= 24) {
          trafficDensity = 0;
        } else if (trafficDensity > 200) {
          trafficDensity = trafficDensity - 34;
        } else {
          trafficDensity = trafficDensity - 24;
        }
        trafficDensityMap.set(x, y, trafficDensity);
      }
    }
  },
  getPollutionValue(tileValue: number) {
    if (tileValue < TileValues.POWERBASE) {
      // Roads, fires and radiation lie below POWERBASE

      // Heavy traffic is bad
      if (tileValue >= TileValues.HTRFBASE) return 75;

      // Low traffic not so much
      if (tileValue >= TileValues.LTRFBASE) return 50;

      if (tileValue < TileValues.ROADBASE) {
        // Fire = carbon monoxide = a bad score for you
        if (tileValue > TileValues.FIREBASE) return 90;

        // Radiation. Top of the charts.
        if (tileValue >= TileValues.RADTILE) return 255;
      }

      // All other types of ground are pure.
      return 0;
    }

    // If we've reached this point, we're classifying some form of zone tile

    // Residential and commercial zones don't pollute
    if (tileValue <= TileValues.LASTIND) return 0;

    // Industrial zones, however...
    if (tileValue < TileValues.PORTBASE) return 50;

    // Coal power plants are bad
    if (tileValue <= TileValues.LASTPOWERPLANT) return 100;

    return 0;
  },
  // Compute the Manhattan distance of the given point from the city centre, and force into the range 0-64
  getCityCentreDistance(map: GameMap, x: number, y: number) {
    let xDis: number, yDis: number;

    if (x > map.cityCentreX) {
      xDis = x - map.cityCentreX;
    } else {
      xDis = map.cityCentreX - x;
    }

    if (y > map.cityCentreY) {
      yDis = y - map.cityCentreY;
    } else {
      yDis = map.cityCentreY - y;
    }

    return Math.min(xDis + yDis, 64);
  },
  // This monster function fills up the landValueMap, the terrainDensityMap and the pollutionDensityMap based
  // on values found by iterating over the map.
  //
  // Factors that affect land value:
  //   * Distance from the city centre
  //   * High crime
  //   * High pollution
  //   * Proximity to undeveloped terrain (who doesn't love a good view?)
  //
  // Pollution is completely determined by the tile types in the block
  pollutionTerrainLandValueScan(map: GameMap, census: iCensus, blockMaps: BlockMapSimulation) {
    // We record raw pollution readings for each tile into tempMap1, and then use tempMap2 and tempMap1 to smooth
    // out the pollution in order to construct the new values for the populationDensityMap

    const tempMap1 = blockMaps.tempMap1;
    const tempMap2 = blockMaps.tempMap2;
    // tempMap3 will be used to record raw terrain information, i.e. if the the land is developed. This will be
    // smoothed in to terrainDensityMap later
    const tempMap3 = blockMaps.tempMap3;
    tempMap3.clear();
    const landValueMap = blockMaps.landValueMap;
    const terrainDensityMap = blockMaps.terrainDensityMap;
    const pollutionDensityMap = blockMaps.pollutionDensityMap;
    const crimeRateMap = blockMaps.crimeRateMap;
    let x, y;
    const width = landValueMap.width;
    const height = landValueMap.height;

    let totalLandValue = 0;
    let developedTileCount = 0;
    for (x = 0; x < width; x++) {
      for (y = 0; y < height; y++) {
        let pollutionLevel = 0;
        let developed = false;
        // The land value map has a chunk size of 2
        const worldX = x * 2;
        const worldY = y * 2;
        for (let mapX = worldX; mapX <= worldX + 1; mapX++) {
          for (let mapY = worldY; mapY <= worldY + 1; mapY++) {
            const tileValue = map.getTileValue(mapX, mapY);
            if (tileValue === TileValues.DIRT) {
              continue;
            }
            if (tileValue < TileValues.RUBBLE) {
              // Undeveloped land: record in tempMap3. Each undeveloped piece of land scores 15.
              // tempMap3 has a chunk size of 4, so each square in tempMap3 will ultimately contain a
              // maximum value of 240
              const terrainValue = tempMap3.worldGet(mapX, mapY);
              tempMap3.worldSet(mapX, mapY, terrainValue + 15);
              continue;
            }
            pollutionLevel += this.getPollutionValue(tileValue);
            if (tileValue >= TileValues.ROADBASE) {
              developed = true;
            }
          }
        }

        //Clamp pollution in range 0-255 (at the moment it's range is 0-1020) and record it for later.
        pollutionLevel = Math.min(pollutionLevel, 255);
        tempMap1.set(x, y, pollutionLevel);
        if (developed) {
          // getCityCentreDistance returns a score in the range 0-64, so, after shifting, landValue will be in
          // range 8-136
          let landValue = 34 - Math.floor(this.getCityCentreDistance(map, worldX, worldY) / 2);
          landValue = landValue << 2;

          // Land in the same neighbourhood as unspoiled land is more valuable...
          landValue += terrainDensityMap.get(x >> 1, y >> 1);

          // ... and polluted land obviously is less valuable
          landValue -= pollutionDensityMap.get(x, y);

          // ... getting mugged won't help either
          if (crimeRateMap.get(x, y) > 190) {
            landValue -= 20;
          }

          // Clamp in range 1-250 (0 represents undeveloped land)
          landValue = miscUtilsController.clamp(landValue, 1, 250);
          landValueMap.set(x, y, landValue);

          totalLandValue += landValue;
          developedTileCount++;
        } else {
          landValueMap.set(x, y, 0);
        }
      }
    }
    if (developedTileCount > 0) {
      census.landValueAverage = Math.floor(totalLandValue / developedTileCount);
    } else {
      census.landValueAverage = 0;
    }
    // Smooth the pollution map twice
    this.smoothMap(tempMap1, tempMap2, this.SMOOTH_ALL_THEN_CLAMP);
    this.smoothMap(tempMap2, tempMap1, this.SMOOTH_ALL_THEN_CLAMP);
    let maxPollution = 0;
    let pollutedTileCount = 0;
    let totalPollution = 0;
    // We iterate over the now-smoothed pollution map rather than using the block map's copy routines
    // so that we can compute the average and total pollution en-route
    for (x = 0; x < width; x += pollutionDensityMap.blockSize) {
      for (y = 0; y < height; y += pollutionDensityMap.blockSize) {
        // Copy the values into pollutionDensityMap
        const pollution = tempMap1.worldGet(x, y);
        pollutionDensityMap.worldSet(x, y, pollution);
        if (pollution !== 0) {
          pollutedTileCount++;
          totalPollution += pollution;
          // Note the most polluted location: any monsters will be drawn there (randomly choosing one
          // if we have multiple competitors for most polluted)
          if (pollution > maxPollution || (pollution === maxPollution && Random.getChance(3))) {
            maxPollution = pollution;
            map.pollutionMaxX = x;
            map.pollutionMaxY = y;
          }
        }
      }
    }
    if (pollutedTileCount) {
      census.pollutionAverage = Math.floor(totalPollution / pollutedTileCount);
    } else {
      census.pollutionAverage = 0;
    }
    this.smoothMap(tempMap3, terrainDensityMap, this.SMOOTH_NEIGHBOURS_THEN_BLOCK);
  },
  crimeScan(census: iCensus, blockMaps: BlockMapSimulation) {
    const policeStationMap = blockMaps.policeStationMap;
    const policeStationEffectMap = blockMaps.policeStationEffectMap;
    const crimeRateMap = blockMaps.crimeRateMap;
    const landValueMap = blockMaps.landValueMap;
    const populationDensityMap = blockMaps.populationDensityMap;

    this.smoothMap(policeStationMap, policeStationEffectMap, this.SMOOTH_NEIGHBOURS_THEN_BLOCK);
    this.smoothMap(policeStationEffectMap, policeStationMap, this.SMOOTH_NEIGHBOURS_THEN_BLOCK);
    this.smoothMap(policeStationMap, policeStationEffectMap, this.SMOOTH_NEIGHBOURS_THEN_BLOCK);

    let totalCrime = 0;
    let crimeZoneCount = 0;
    // Scan the map, looking for developed land, as it can attract crime.
    //TO-DO crimescan not function
    const w = crimeRateMap.width; // 0; // crimeRateMap.width;
    const h = crimeRateMap.height;
    const blockSize = crimeRateMap.blockSize;
    for (let x = 0; x < w; x += blockSize) {
      for (let y = 0; y < h; y += blockSize) {
        // Remember: landValueMap values are in the range 0-250
        let value = landValueMap.worldGet(x, y);
        if (value > 0) {
          crimeZoneCount += 1;
          // Force value in the range -122 to 128. Lower valued pieces of land attract more crime.
          value = 128 - value;
          // Add population density (a value between 0 and 510). value now lies in range -260 - 382.
          // Denser areas attract more crime.
          value += populationDensityMap.worldGet(x, y);

          // Clamp in range -260 to 300
          value = Math.min(value, 300);

          // If the police are nearby, there's no point committing the crime of the century
          value -= policeStationMap.worldGet(x, y);

          // Force in to range 0-250
          value = miscUtilsController.clamp(value, 0, 250);

          crimeRateMap.worldSet(x, y, value);
          totalCrime += value;
        } else {
          crimeRateMap.worldSet(x, y, 0);
        }
      }
    }

    if (crimeZoneCount > 0) {
      //console.log(totalCrime, "totalcrime", crimeZoneCount, Math.floor(totalCrime / crimeZoneCount));
      census.crimeAverage = Math.floor(totalCrime / (crimeZoneCount * 2));
    } else {
      census.crimeAverage = 0;
    }
  },

  // Iterate over the map, and score each neighbourhood on its distance from the city centre. Scores are in the range
  // -64 to 64. This affects the growth of commercial zones within that neighbourhood.

  fillCityCentreDistScoreMap(map: GameMap, blockMaps: BlockMapSimulation) {
    const cityCentreDistScoreMap = blockMaps.cityCentreDistScoreMap;

    for (let x = 0, width = cityCentreDistScoreMap.width; x < width; x++) {
      for (let y = 0, height = cityCentreDistScoreMap.height; y < height; y++) {
        // First, we compute the Manhattan distance of the top-left hand corner of the neighbourhood to the city centre
        // and half that value. This leaves us a value in the range 0 - 32
        let value = Math.floor(this.getCityCentreDistance(map, x * 8, y * 8) / 2);
        // Now, we scale up by a factor of 4. We're in the range 0 - 128
        value = value * 4;
        // And finally, subtract from 64, leaving us a score in the range -64 to 64
        value = 64 - value;
        cityCentreDistScoreMap.set(x, y, value);
      }
    }
  },
  getPopulationDensity(map: GameMap, x: number, y: number, tile: number) {
    if (tile < TileValues.COMBASE) {
      return residentialController.getZonePopulation(map, x, y, tile);
    }

    if (tile < TileValues.INDBASE) {
      return commercialController.getZonePopulation(map, x, y, tile) * 8;
    }

    if (tile < TileValues.PORTBASE) {
      return industrialController.getZonePopulation(map, x, y, tile) * 8;
    }

    return 0;
  },
  populationDensityScan(map: GameMap, blockMaps: BlockMapSimulation) {
    // We will build the initial unsmoothed map in tempMap1, and smooth it in to tempMap2
    const tempMap1 = blockMaps.tempMap1;
    const tempMap2 = blockMaps.tempMap2;

    // We will sum all the coordinates that contain zones into xTot and yTot. They are used in our city centre
    // heuristic.
    let xTot = 0;
    let yTot = 0;
    let zoneTotal = 0;

    tempMap1.clear();

    for (let x = 0, width = map.width; x < width; x++) {
      for (let y = 0, height = map.height; y < height; y++) {
        const tile = map.getTile(x, y);
        if (tile.isZone()) {
          const tileValue = tile.getValue();

          // Ask the zone to calculate its population, scale it up, then clamp in the range 0-254
          let population = this.getPopulationDensity(map, x, y, tileValue) * 8;
          population = Math.min(population, 254);

          // The block size of population density is 2x2, so there can only be 1 zone per block
          tempMap1.worldSet(x, y, population);

          xTot += x;
          yTot += y;
          zoneTotal++;
        }
      }
    }
    this.smoothMap(tempMap1, tempMap2, this.SMOOTH_ALL_THEN_CLAMP);
    this.smoothMap(tempMap2, tempMap1, this.SMOOTH_ALL_THEN_CLAMP);
    this.smoothMap(tempMap1, tempMap2, this.SMOOTH_ALL_THEN_CLAMP);
    blockMaps.populationDensityMap.copyFrom(tempMap2, function (x) {
      return x * 2;
    });

    this.fillCityCentreDistScoreMap(map, blockMaps);

    // Compute new city centre
    if (zoneTotal > 0) {
      map.cityCentreX = Math.floor(xTot / zoneTotal);
      map.cityCentreY = Math.floor(yTot / zoneTotal);
    } else {
      map.cityCentreX = Math.floor(map.width / 2);
      map.cityCentreY = Math.floor(map.height / 2);
    }
  },
  // Compute the radius of coverage for the firestations found during the map scan
  fireAnalysis(blockMaps: BlockMapSimulation) {
    const fireStationMap = blockMaps.fireStationMap;
    const fireStationEffectMap = blockMaps.fireStationEffectMap;

    this.smoothMap(fireStationMap, fireStationEffectMap, this.SMOOTH_NEIGHBOURS_THEN_BLOCK);
    this.smoothMap(fireStationEffectMap, fireStationMap, this.SMOOTH_NEIGHBOURS_THEN_BLOCK);
    this.smoothMap(fireStationMap, fireStationEffectMap, this.SMOOTH_NEIGHBOURS_THEN_BLOCK);
  },
};