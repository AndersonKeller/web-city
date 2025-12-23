import type { GameMap } from "../map/gameMap-ts";
import type { iMapScanner } from "../map/mapScanner-ts";
import { Random } from "../utils/random";
import type { iRepairManager } from "../manager/repairManager-ts";
import type { iSimulation } from "../simulation/simulation-ts";
import { tileUtilsController } from "./tileUtils-ts";
// import { TileUtils } from "./tileUtils";
import { DIRT, IZB, RADTILE } from "./tileValues";
import { zoneUtilsController } from "../utils/zoneUtils-ts";

export const miscTilesController = {
  xDelta: [-1, 0, 1, 0],
  yDelta: [0, -1, 0, 1],
  fireFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.census.firePop += 1;
    if ((Random.getRandom16() & 3) !== 0) {
      return;
    }
    // Try to set neighbouring tiles on fire as well
    for (let i = 0; i < 4; i++) {
      if (Random.getChance(7)) {
        const xTem = x + this.xDelta[i];
        const yTem = y + this.yDelta[i];

        if (map.testBounds(xTem, yTem)) {
          const tile = map.getTile(x, y);
          if (!tile.isCombustible()) continue;

          if (tile.isZone()) {
            // Neighbour is a ione and burnable
            zoneUtilsController.fireZone(map, x, y, simData.blockMaps);

            // Industrial zones etc really go boom
            if (tile.getValue() > IZB) simData.spriteManager.makeExplosionAt(x, y);
          }
          //NEED 2 ARGS
          //map.setTo(TileUtils.randomFire());
        }
      }
    }
    let rate = 10;
    const i = simData.blockMaps.fireStationEffectMap.worldGet(x, y);
    if (i > 100) {
      rate = 1;
    } else if (i > 20) {
      rate = 2;
    } else if (i > 0) {
      rate = 3;
    }
    if (Random.getRandom(rate) === 0) {
      map.setTo(x, y, tileUtilsController.randomRubble());
    }
  },
  radiationFound(map: GameMap, x: number, y: number, _simData: iSimulation) {
    if (Random.getChance(4095)) {
      map.setTile(x, y, DIRT, 0);
    }
  },
  floodFound(_map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.disasterManager.doFlood(x, y, simData.blockMaps);
  },
  registerHandlers(mapScanner: iMapScanner, _repairManager: iRepairManager) {
    const tileUtils = tileUtilsController;
    mapScanner.addAction(tileUtils.isFire, this.fireFound.bind(this));
    mapScanner.addAction(RADTILE, this.radiationFound.bind(this));
    mapScanner.addAction(tileUtils.isFlood, this.floodFound.bind(this));
  },
};