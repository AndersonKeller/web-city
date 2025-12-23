import type { GameMap } from "../map/gameMap-ts.ts";
import type { iMapScanner } from "../map/mapScanner-ts.ts";
import { Random } from "../utils/random.ts";
import type { iRepairManager } from "../manager/repairManager-ts.ts";
import type { iSimulation } from "./simulation-ts.ts";
import { SPRITE_SHIP } from "../utils/spriteConstants.ts";
import { ANIMBIT, BURNBIT, CONDBIT } from "../tiles/tileFlags.ts";
import { tileUtilsController } from "../tiles/tileUtils-ts.ts";
// import { TileUtils } from "./tileUtils";
import * as TileValues from "../tiles/tileValues.ts";
export const transportController = {
  railFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.census.railTotal += 1;

    simData.spriteManager.generateTrain(simData.census, x, y);

    if (simData.budget.shouldDegradeRoad()) {
      if (Random.getChance(511)) {
        const currentTile = map.getTile(x, y);
        if (currentTile.isConductive()) {
          return;
        }
        if (simData.budget.roadEffect < (Random.getRandom16() & 31)) {
          const mapValue = currentTile.getValue();

          // Replace bridge tiles with water, otherwise rubble
          if (mapValue < TileValues.RAILBASE + 2) {
            map.setTile(x, y, TileValues.RIVER, 0);
          } else {
            map.setTo(x, y, tileUtilsController.randomRubble());
          }
        }
      }
    }
  },
  airportFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.census.airportPop += 1;

    const tile = map.getTile(x, y);
    if (tile.isPowered()) {
      if (map.getTileValue(x + 1, y - 1) === TileValues.RADAR) {
        map.setTile(x + 1, y - 1, TileValues.RADAR0, CONDBIT | ANIMBIT | BURNBIT);
      }
      if (Random.getRandom(5) === 0) {
        simData.spriteManager.generatePlane(x, y);
        return;
      }
      if (Random.getRandom(12) === 0) {
        simData.spriteManager.generateCopter(x, y);
      }
    } else {
      map.setTile(x + 1, y - 1, TileValues.RADAR, CONDBIT | BURNBIT);
    }
  },
  portFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.census.seaportPop += 1;
    const tile = map.getTile(x, y);
    if (tile.isPowered() && simData.spriteManager.getSprite(SPRITE_SHIP) === null) {
      simData.spriteManager.generateShip();
    }
  },
  registerHandlers(mapScanner: iMapScanner, repairManager: iRepairManager) {
    // const tileUtils = tileUtilsController;

    mapScanner.addAction(tileUtilsController.isRail, this.railFound.bind(this));
    mapScanner.addAction(TileValues.PORT, this.portFound.bind(this));
    mapScanner.addAction(TileValues.AIRPORT, this.airportFound.bind(this));
    repairManager.addAction(TileValues.PORT, 15, 4);
    repairManager.addAction(TileValues.AIRPORT, 7, 6);
  },
};