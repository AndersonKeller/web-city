import type { GameMap } from "../map/gameMap-ts.ts";
import type { iMapScanner } from "../map/mapScanner-ts.ts";
import { Random } from "../utils/random.ts";
import type { iRepairManager } from "../manager/repairManager-ts.ts";
import type { iSimulation } from "../simulation/simulation-ts.ts";
import { Tile } from "./tile.ts";
import { ANIMBIT, BIT_MASK, BULLBIT } from "./tileFlags";
import { tileUtilsController } from "./tileUtils-ts.ts";
// import { TileUtils } from "./tileUtils.js";
import * as TileValues from "./tileValues.ts";
export const roadController = {
  verticalDeltaX: [0, 1, 0, 0, 0, 0, 1],
  verticalDeltaY: [-2, -2, -1, 0, 1, 2, 2],
  openVertical: [
    TileValues.VBRDG0 | BULLBIT,
    TileValues.VBRDG1 | BULLBIT,
    TileValues.RIVER,
    TileValues.BRWV | BULLBIT,
    TileValues.RIVER,
    TileValues.VBRDG2 | BULLBIT,
    TileValues.VBRDG3 | BULLBIT,
  ],
  closeVertical: [
    TileValues.VBRIDGE | BULLBIT,
    TileValues.RIVER,
    TileValues.VBRIDGE | BULLBIT,
    TileValues.VBRIDGE | BULLBIT,
    TileValues.VBRIDGE | BULLBIT,
    TileValues.VBRIDGE | BULLBIT,
    TileValues.RIVER,
  ],
  horizontalDeltaX: [-2, 2, -2, -1, 0, 1, 2],
  horizontalDeltaY: [-1, -1, 0, 0, 0, 0, 0],
  openHorizontal: [
    TileValues.HBRDG1 | BULLBIT,
    TileValues.HBRDG3 | BULLBIT,
    TileValues.HBRDG0 | BULLBIT,
    TileValues.RIVER,
    TileValues.BRWH | BULLBIT,
    TileValues.RIVER,
    TileValues.HBRDG2 | BULLBIT,
  ],
  closeHorizontal: [
    TileValues.RIVER,
    TileValues.RIVER,
    TileValues.HBRIDGE | BULLBIT,
    TileValues.HBRIDGE | BULLBIT,
    TileValues.HBRIDGE | BULLBIT,
    TileValues.HBRIDGE | BULLBIT,
    TileValues.HBRIDGE | BULLBIT,
  ],
  densityTable: [TileValues.ROADBASE, TileValues.LTRFBASE, TileValues.HTRFBASE],
  openBridge(map: GameMap, origX: number, origY: number, xDelta: number[], yDelta: number[], oldTiles: number[], newTIles: number[]) {
    for (let i = 0; i < 7; i++) {
      const x = origX + xDelta[i];
      const y = origY + yDelta[i];
      if (map.testBounds(x, y)) {
        if (map.getTileValue(x, y) === (oldTiles[i] & BIT_MASK)) {
          map.setTileValue(x, y, newTIles[i]);
        }
      }
    }
  },
  closeBridge(map: GameMap, origX: number, origY: number, xDelta: number[], yDelta: number[], oldTiles: number[], newTIles: number[]) {
    for (let i = 0; i < 7; i++) {
      const x = origX + xDelta[i];
      const y = origY + yDelta[i];
      if (map.testBounds(x, y)) {
        const tileValue = map.getTileValue(x, y);
        if (tileValue === TileValues.CHANNEL || (tileValue & 15) === (oldTiles[i] & 15)) {
          map.setTileValue(x, y, newTIles[i]);
        }
      }
    }
  },
  doBridge(map: GameMap, x: number, y: number, currentTile: number, simData: iSimulation) {
    if (currentTile === TileValues.BRWV) {
      // We have an open vertical bridge. Possibly close it.
      if (Random.getChance(3) && simData.spriteManager.getBoatDistance(x, y) > 340) {
        this.closeBridge(map, x, y, this.verticalDeltaX, this.verticalDeltaY, this.openVertical, this.closeVertical);
        return true;
      }
    }
    if (currentTile === TileValues.BRWH) {
      // We have an open horizontal bridge. Possibly close it.
      if (Random.getChance(3) && simData.spriteManager.getBoatDistance(x, y) > 340)
        this.closeBridge(map, x, y, this.horizontalDeltaX, this.horizontalDeltaY, this.openHorizontal, this.closeHorizontal);

      return true;
    }
    if (simData.spriteManager.getBoatDistance(x, y) < 300 || Random.getChance(7)) {
      if (currentTile & 1) {
        if (x < map.width - 1) {
          if (map.getTileValue(x + 1, y) === TileValues.CHANNEL) {
            // We have a closed vertical bridge. Open it.
            this.openBridge(map, x, y, this.verticalDeltaX, this.verticalDeltaY, this.closeVertical, this.openVertical);
            return true;
          }
        }
        return false;
      } else {
        if (y > 0) {
          if (map.getTileValue(x, y - 1) === TileValues.CHANNEL) {
            // We have a closed horizontal bridge. Open it.
            this.openBridge(map, x, y, this.horizontalDeltaX, this.horizontalDeltaY, this.closeHorizontal, this.openHorizontal);
            return true;
          }
        }
      }
    }
    return false;
  },
  roadFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.census.roadTotal += 1;
    const currentTile = map.getTile(x, y);
    const tileValue = currentTile.getValue();

    if (simData.budget.shouldDegradeRoad()) {
      if (Random.getChance(511)) {
        // currentTile = map.getTile(x, y);
        // Don't degrade tiles with power lines
        if (!currentTile.isConductive()) {
          if (simData.budget.roadEffect < (Random.getRandom16() & 31)) {
            // Replace bridge tiles with water, otherwise rubble
            if ((tileValue & 15) < 2 || (tileValue & 15) === 15) {
              map.setTile(x, y, TileValues.RIVER, 0);
            } else {
              map.setTo(x, y, tileUtilsController.randomRubble());
            }
            return;
          }
        }
      }
    }
    // Bridges are not combustible
    if (!currentTile.isCombustible()) {
      // The comment in the original Micropolis code states bridges count for 4
      // However, with the increment above, it's actually 5. Bug?
      simData.census.roadTotal += 4;
      if (this.doBridge(map, x, y, tileValue, simData)) return;
    }
    // Examine traffic density, and modify tile to represent last scanned traffic
    // density
    let density = 0;
    if (tileValue < TileValues.LTRFBASE) {
      density = 0;
    } else if (tileValue < TileValues.HTRFBASE) {
      density = 1;
    } else {
      // Heavy traffic counts as two tiles with regards to upkeep cost
      // Note, if this is heavy traffic on a bridge, and it wasn't handled above,
      // it actually counts for 7 road tiles
      simData.census.roadTotal += 1;
      density = 2;
    }
    // Force currentDensity in range 0-3 (trafficDensityMap values are capped at 240)
    let currentDensity = simData.blockMaps.trafficDensityMap.worldGet(x, y) >> 6;
    if (currentDensity > 1) {
      currentDensity -= 1;
    }
    if (currentDensity === density) {
      return;
    }
    const newValue = ((tileValue - TileValues.ROADBASE) & 15) + this.densityTable[currentDensity];
    //preserve all bits except animation
    let newFlags = currentTile.getFlags() & ~ANIMBIT;
    if (currentDensity > 0) {
      newFlags |= ANIMBIT;
    }
    map.setTo(x, y, new Tile(newValue, newFlags));
  },
  registerHandlers(mapScanner: iMapScanner, _repairManager: iRepairManager) {
    const tileUtils = tileUtilsController;
    mapScanner.addAction(tileUtils.isRoad, this.roadFound.bind(this));
  },
};
