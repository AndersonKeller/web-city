import type { GameMap } from "../map/gameMap-ts";
import { BURNBIT, CONDBIT } from "../tiles/tileFlags";
import { ROADBASE, RUBBLE } from "../tiles/tileValues";
export type iRepairManager = typeof repairManagerController;
export const repairManagerController = {
  _map: null as GameMap,
  _actions: [],
  create(map) {
    this._map = map;
    return this;
  },
  isCallable(f) {
    return typeof f === "function";
  },
  addAction(criterion, period, zoneSize) {
    this._actions.push({ criterion, period, zoneSize });
  },
  repairZone(x: number, y: number, zoneSize: number) {
    const centre = this._map.getTileValue(x, y);
    let tileValue = centre - zoneSize - 2;
    for (let yy = -1; yy < zoneSize - 1; yy++) {
      for (let xx = -1; xx < zoneSize - 1; xx++) {
        tileValue++;

        const current = this._map.getTile(x + xx, y + yy);
        if (current.isZone() || current.isAnimated()) {
          continue;
        }

        const currentValue = current.getValue();
        if (currentValue < RUBBLE || currentValue >= ROADBASE) {
          this._map.setTile(x + xx, y + yy, tileValue, CONDBIT | BURNBIT);
        }
      }
    }
  },
  checkTile(x: number, y: number, cityTime: number) {
    for (let i = 0; i < this._actions.length; i++) {
      const current = this._actions[i];
      const period = current.period;
      if ((cityTime & period) !== 0) {
        continue;
      }
      const tile = this._map.getTile(x, y);
      const tileValue = tile.getValue();

      const callable = this.isCallable(current.criterion);
      if (callable && current.criterion.call(null, tile)) {
        this.repairZone(x, y, current.zoneSize);
      } else if (!callable && current.criterion === tileValue) {
        this.repairZone(x, y, current.zoneSize);
      }
    }
  },
};
