import type { GameMap } from "./gameMap-ts";
import { Tile } from "../tiles/tile";
import { FLOOD } from "../tiles/tileValues";
export type iMapScanner = typeof mapScannerController;
export const mapScannerController = {
  _map: null as GameMap,
  _actions: [],
  tile: null as Tile,
  create(map: GameMap) {
    this._map = map;
    this.tile = new Tile();
    return this;
  },
  addAction(criterion, action) {
    this._actions.push({ criterion, action });
  },
  isCallable(f) {
    return typeof f === "function";
  },
  mapScan(startX: number, maxX: number, simData) {
    for (let y = 0; y < this._map.height; y++) {
      for (let x = startX; x < maxX; x++) {
        this._map.getTile(x, y, this.tile);
        const tileValue = this.tile.getValue();

        if (tileValue < FLOOD) continue;

        if (this.tile.isConductive()) simData.powerManager.setTilePower(x, y);

        if (this.tile.isZone()) {
          simData.repairManager.checkTile(x, y, simData.cityTime);
          const powered = this.tile.isPowered();
          if (powered) simData.census.poweredZoneCount += 1;
          else simData.census.unpoweredZoneCount += 1;
        }

        for (let i = 0, l = this._actions.length; i < l; i++) {
          const current = this._actions[i];
          const callable = this.isCallable(current.criterion);

          if (callable && current.criterion.call(null, this.tile)) {
            current.action.call(null, this._map, x, y, simData);
            break;
          } else if (!callable && current.criterion === tileValue) {
            current.action.call(null, this._map, x, y, simData);
            break;
          }
        }
      }
    }
  },
};
