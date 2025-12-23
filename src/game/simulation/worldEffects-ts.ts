import { gameMapController, type GameMap } from "../map/gameMap-ts";
import { Tile } from "../tiles/tile";
export type iWorldEffects = typeof worldEffectsController;
export const worldEffectsController = {
  _map: null as GameMap,
  _data: {},

  create(map: GameMap) {
    this._map = map;
    this._data = {};

    return this;
  },
  toKey(x: number, y: number) {
    return [x, y].join(",");
  },
  fromKey(key: string) {
    let k: string[] = key.split(",");
    return {
      x: Number(k[0]),
      y: Number(k[1]),
      toString: () => {
        return `World effect coord:(${k[0]},${k[1]})`;
      },
    };
  },
  clear() {
    this._data = [];
  },
  getTile(x: number, y: number): Tile {
    const key = this.toKey(x, y);
    let tile = this._data[key];

    if (tile === undefined) {
      tile = gameMapController.getTile(x, y);
    }
    return tile;
  },
  getTileValue(x: number, y: number) {
    return this.getTile(x, y).getValue();
  },
  setTile(x: number, y: number, value: number | Tile, flags?: number) {
    if (flags !== undefined && value instanceof Tile) {
      throw new Error("Flags supplied with already defined tile");
    }
    if (!gameMapController.testBounds(x, y)) {
      throw new Error("WorldEffects setTile called with invalid bounds " + x + ", " + y);
    }
    if (flags === undefined && !(value instanceof Tile)) {
      value = new Tile(value);
    } else if (flags !== undefined && typeof value === "number") {
      value = new Tile(value, flags);
    }
    const key = this.toKey(x, y);
    this._data[key] = value;
  },
  apply() {
    const keys = Object.keys(this._data);
    for (let i = 0; i < keys.length; i++) {
      const coords = this.fromKey(keys[i]);

      gameMapController.setTo(coords.x, coords.y, this._data[keys[i]]);
    }
  },
};