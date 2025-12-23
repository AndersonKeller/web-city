import type { GameMap } from "../map/gameMap-ts.ts";
import { miscUtilsController } from "./miscUtils-ts.ts";
import type { BlockMapSimulation } from "../simulation/simulation-ts.ts";
import { BULLBIT, POWERBIT } from "../tiles/tileFlags.ts";
import * as TileValues from "../tiles/tileValues.ts";
export const zoneUtilsController = {
  checkBigZone(tileValue: number) {
    let result: { zoneSize: number; deltaX: number; deltaY: number };
    switch (tileValue) {
      case TileValues.POWERPLANT:
      case TileValues.PORT:
      case TileValues.NUCLEAR:
      case TileValues.STADIUM:
        result = { zoneSize: 4, deltaX: 0, deltaY: 0 };
        break;
      case TileValues.POWERPLANT + 1:
      case TileValues.COALSMOKE3:
      case TileValues.COALSMOKE3 + 1:
      case TileValues.COALSMOKE3 + 2:
      case TileValues.PORT + 1:
      case TileValues.NUCLEAR + 1:
      case TileValues.STADIUM + 1:
        result = { zoneSize: 4, deltaX: -1, deltaY: 0 };
        break;
      case TileValues.POWERPLANT + 4:
      case TileValues.PORT + 4:
      case TileValues.NUCLEAR + 4:
      case TileValues.STADIUM + 4:
        result = { zoneSize: 4, deltaX: 0, deltaY: -1 };
        break;

      case TileValues.POWERPLANT + 5:
      case TileValues.PORT + 5:
      case TileValues.NUCLEAR + 5:
      case TileValues.STADIUM + 5:
        result = { zoneSize: 4, deltaX: -1, deltaY: -1 };
        break;

      case TileValues.AIRPORT:
        result = { zoneSize: 6, deltaX: 0, deltaY: 0 };
        break;

      case TileValues.AIRPORT + 1:
        result = { zoneSize: 6, deltaX: -1, deltaY: 0 };
        break;

      case TileValues.AIRPORT + 2:
        result = { zoneSize: 6, deltaX: -2, deltaY: 0 };
        break;

      case TileValues.AIRPORT + 3:
        result = { zoneSize: 6, deltaX: -3, deltaY: 0 };
        break;

      case TileValues.AIRPORT + 6:
        result = { zoneSize: 6, deltaX: 0, deltaY: -1 };
        break;

      case TileValues.AIRPORT + 7:
        result = { zoneSize: 6, deltaX: -1, deltaY: -1 };
        break;

      case TileValues.AIRPORT + 8:
        result = { zoneSize: 6, deltaX: -2, deltaY: -1 };
        break;

      case TileValues.AIRPORT + 9:
        result = { zoneSize: 6, deltaX: -3, deltaY: -1 };
        break;

      case TileValues.AIRPORT + 12:
        result = { zoneSize: 6, deltaX: 0, deltaY: -2 };
        break;

      case TileValues.AIRPORT + 13:
        result = { zoneSize: 6, deltaX: -1, deltaY: -2 };
        break;

      case TileValues.AIRPORT + 14:
        result = { zoneSize: 6, deltaX: -2, deltaY: -2 };
        break;

      case TileValues.AIRPORT + 15:
        result = { zoneSize: 6, deltaX: -3, deltaY: -2 };
        break;

      case TileValues.AIRPORT + 18:
        result = { zoneSize: 6, deltaX: 0, deltaY: -3 };
        break;

      case TileValues.AIRPORT + 19:
        result = { zoneSize: 6, deltaX: -1, deltaY: -3 };
        break;

      case TileValues.AIRPORT + 20:
        result = { zoneSize: 6, deltaX: -2, deltaY: -3 };
        break;

      case TileValues.AIRPORT + 21:
        result = { zoneSize: 6, deltaX: -3, deltaY: -3 };
        break;

      default:
        result = { zoneSize: 0, deltaX: 0, deltaY: 0 };
        break;
    }
    return result;
  },
  checkZoneSize(tileValue: number) {
    if (
      (tileValue >= TileValues.RESBASE - 1 && tileValue <= TileValues.PORTBASE - 1) ||
      (tileValue >= TileValues.LASTPOWERPLANT + 1 && tileValue <= TileValues.POLICESTATION + 4) ||
      (tileValue >= TileValues.CHURCH1BASE && tileValue <= TileValues.CHURCH7LAST)
    ) {
      return 3;
    }

    if (
      (tileValue >= TileValues.PORTBASE && tileValue <= TileValues.LASTPORT) ||
      (tileValue >= TileValues.COALBASE && tileValue <= TileValues.LASTPOWERPLANT) ||
      (tileValue >= TileValues.STADIUMBASE && tileValue <= TileValues.LASTZONE)
    ) {
      return 4;
    }

    return 0;
  },
  fireZone(map: GameMap, x: number, y: number, blockMaps: BlockMapSimulation) {
    const tileValue = map.getTileValue(x, y);
    let zoneSize = 2;

    // A zone being on fire naturally hurts growth
    let value = blockMaps.rateOfGrowthMap.worldGet(x, y);
    value = miscUtilsController.clamp(value - 20, -200, 200);
    blockMaps.rateOfGrowthMap.worldSet(x, y, value);

    if (tileValue === TileValues.AIRPORT) {
      zoneSize = 5;
    } else if (tileValue >= TileValues.PORTBASE) {
      zoneSize = 3;
    } else if (tileValue < TileValues.PORTBASE) {
      zoneSize = 2;
    }

    // Make remaining tiles of the zone bulldozable
    for (let xDelta = -1; xDelta < zoneSize; xDelta++) {
      for (let yDelta = -1; yDelta < zoneSize; yDelta++) {
        const xTem = x + xDelta;
        const yTem = y + yDelta;

        if (!map.testBounds(xTem, yTem)) continue;
        if (yTem >= TileValues.ROADBASE) {
          if (map.getTileValue(xTem, yTem)) {
            map.addTileFlags(xTem, yTem, BULLBIT);
          }
        }
      }
    }
  },
  getLandPollutionValue(blockMaps: BlockMapSimulation, x, y) {
    let landValue = blockMaps.landValueMap.worldGet(x, y);
    landValue -= blockMaps.pollutionDensityMap.worldGet(x, y);

    if (landValue < 30) {
      return 0;
    }
    if (landValue < 80) {
      return 1;
    }
    if (landValue < 150) {
      return 2;
    }

    return 3;
  },
  incRateOfGrowth(blockMaps: BlockMapSimulation, x: number, y: number, growthDelta: number) {
    const currentRate = blockMaps.rateOfGrowthMap.worldGet(x, y);
    // TODO why the scale of 4 here
    const newValue = miscUtilsController.clamp(currentRate + growthDelta * 4, -200, 200);
    blockMaps.rateOfGrowthMap.worldSet(x, y, newValue);
  },
  // Calls map.putZone after first checking for flood, fire
  // and radiation. Should be called with coordinates of centre tile.
  putZone(map: GameMap, x: number, y: number, centreTile: number, isPowered: boolean) {
    for (let dY = -1; dY < 2; dY++) {
      for (let dX = -1; dX < 2; dX++) {
        const tileValue = map.getTileValue(x + dX, y + dY);
        if (tileValue >= TileValues.FLOOD && tileValue < TileValues.ROADBASE) {
          return;
        }
      }
    }
    map.putZone(x, y, centreTile, 3);
    map.addTileFlags(x, y, BULLBIT);
    if (isPowered) {
      map.addTileFlags(x, y, POWERBIT);
    }
  },
};