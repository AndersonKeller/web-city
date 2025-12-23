import type { GameMap } from "../map/gameMap-ts";
import type { iMapScanner } from "../map/mapScanner-ts";
import type { iRepairManager } from "../manager/repairManager-ts";
import type { iSimulation } from "./simulation-ts";
import { ANIMBIT, POWERBIT } from "../tiles/tileFlags";
import { FOOTBALLGAME1, FOOTBALLGAME2, FULLSTADIUM, STADIUM } from "../tiles/tileValues";

export const stadiaController = {
  emptyStadiumFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.census.stadiumPop += 1;
    if (map.getTile(x, y).isPowered()) {
      // Occasionally start the big game
      if (((simData._cityTime + x + y) & 31) === 0) {
        map.putZone(x, y, FULLSTADIUM, 4);
        map.addTileFlags(x, y, POWERBIT);
        map.setTile(x + 1, y, FOOTBALLGAME1, ANIMBIT);
        map.setTile(x + 1, y + 1, FOOTBALLGAME2, ANIMBIT);
      }
    }
  },
  fullStadiumFound(map: GameMap, x: number, y: number, simData: iSimulation) {
    simData.census.stadiumPop += 1;
    const isPowered = map.getTile(x, y).isPowered();
    if (((simData._cityTime + x + y) & 7) === 0) {
      map.putZone(x, y, STADIUM, 4);
      if (isPowered) {
        map.addTileFlags(x, y, POWERBIT);
      }
    }
  },
  registerHandlers(mapScanner: iMapScanner, repairManager: iRepairManager) {
    mapScanner.addAction(STADIUM, this.emptyStadiumFound.bind(this));
    mapScanner.addAction(FULLSTADIUM, this.fullStadiumFound.bind(this));
    repairManager.addAction(STADIUM, 15, 4);
  },
};