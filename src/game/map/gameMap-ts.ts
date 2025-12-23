import { Bounds } from "../utils/bounds";
import * as Direction from "../utils/direction";
import { miscUtilsController } from "../utils/miscUtils-ts";

import { Position } from "../utils/position";
import { Tile } from "../tiles/tile";
import { BNCNBIT, ZONEBIT } from "../tiles/tileFlags";
import { TILE_INVALID } from "../tiles/tileValues";

export type GameMap = typeof gameMapController;
export const gameMapController = {
  width: 0,
  height: 0,
  bounds: null as Bounds,
  cityCentreX: 0,
  cityCentreY: 0,
  pollutionMaxX: 0,
  pollutionMaxY: 0,
  isSavedGame: false,
  version: miscUtilsController.makeConstantDescriptor(3),
  saveProps: ["cityCentreX", "cityCentreY", "pollutionMaxX", "pollutionMaxY", "width", "height"],
  _data: null as Tile[],
  create(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.bounds = Bounds.fromOrigin(width, height);
    const defaultValue = new Tile().getValue();
    let data = [];
    for (var i = 0, l = width * height; i < l; i++) {
      data[i] = new Tile(defaultValue);
    }
    this._data = data;
    // Generally set externally
    this.cityCentreX = Math.floor(this.width / 2);
    this.cityCentreY = Math.floor(this.height / 2);
    this.pollutionMaxX = this.cityCentreX;
    this.pollutionMaxY = this.cityCentreY;

    return this;
  },
  save(saveData) {
    for (var i = 0, l = this.saveProps.length; i < l; i++) saveData[this.saveProps[i]] = this[this.saveProps[i]];

    saveData.map = this._data.map(function (t) {
      return { value: t.getRawValue() };
    });
  },
  load(saveData) {
    for (var i = 0, l = this.saveProps.length; i < l; i++) this[this.saveProps[i]] = saveData[this.saveProps[i]];

    const map = saveData.map;
    for (i = 0, l = map.length; i < l; i++) this.setTileValue(i % this.width, Math.floor(i / this.width), map[i].value);
  },
  getTile(x: number, y: number, newTile?: Tile): Tile {
    const width = this.width;
    const height = this.height;

    if (x < 0 || y < 0 || x >= width || y >= height) {
      console.warn("getTile called with bad bounds", x, y);
      return new Tile(TILE_INVALID);
    }
    const tileIndex = x + y * width;
    const tile = this._data[tileIndex];
    // Return the original tile if we're not given a tile to fill
    if (!newTile) {
      return tile;
    }
    newTile.setFrom(tile);
    return tile;
  },
  getTileValue(x: number, y: number): number {
    if (!this.testBounds(x, y)) {
      throw new Error("GameMap getTileValue called with invalid bounds " + x + ", " + y);
    }
    const tileIndex = this._calculateIndex(x, y);
    return this._data[tileIndex].getValue();
  },
  getTileFlags(x: number, y: number): number {
    if (!this.testBounds(x, y)) {
      throw new Error("GameMap getTileFlags called with invalid bounds " + x + ", " + y);
    }

    const tileIndex = this._calculateIndex(x, y);
    return this._data[tileIndex].getFlags();
  },
  getTiles(x: number, y: number, w: number, h: number) {
    if (!this.testBounds(x, y)) {
      throw new Error("GameMap getTiles called with invalid bounds " + x + ", " + y);
    }

    const res = [];
    for (let a = y, ylim = y + h; a < ylim; a++) {
      res[a - y] = [];
      for (let b = x, xlim = x + w; b < xlim; b++) {
        const tileIndex = this._calculateIndex(b, a);
        res[a - y].push(this._data[tileIndex]);
      }
    }
    return res;
  },
  getTileValuesForPainting(x: number, y: number, w: number, h: number, result?: number[] | undefined): number[] {
    result = result || [];
    const width = this.width;
    const height = this.height;

    // Result is stored in row-major order
    for (let a = y, ylim = y + h; a < ylim; a++) {
      for (let b = x, xlim = x + w; b < xlim; b++) {
        if (a < 0 || b < 0 || a >= height || b >= width) {
          result[(a - y) * w + (b - x)] = TILE_INVALID;
          continue;
        }

        const tileIndex = b + a * width;
        result[(a - y) * w + (b - x)] = this._data[tileIndex].getRawValue();
      }
    }

    return result;
  },
  getTileFromMapOrDefault(pos: Position, dir: Direction.Direction, defaultTile: number) {
    switch (dir) {
      case Direction.NORTH:
        if (pos.y > 0) return this.getTileValue(pos.x, pos.y - 1);
        return defaultTile;

      case Direction.EAST:
        if (pos.x < this.width - 1) return this.getTileValue(pos.x + 1, pos.y);

        return defaultTile;

      case Direction.SOUTH:
        if (pos.y < this.height - 1) return this.getTileValue(pos.x, pos.y + 1);

        return defaultTile;

      case Direction.WEST:
        if (pos.x > 0) return this.getTileValue(pos.x - 1, pos.y);

        return defaultTile;

      default:
        return defaultTile;
    }
  },
  setTile(x: number, y: number, value: number, flags: number): void {
    if (!this.testBounds(x, y)) {
      throw new Error("GameMap setTile called with invalid bounds " + x + ", " + y);
    }

    const tileIndex = this._calculateIndex(x, y);
    this._data[tileIndex].set(value, flags);
  },
  setTileValue(x: number, y: number, value?: number | undefined) {
    if (arguments.length < 2) throw new Error("GameMap setTileValue called with too few arguments" + [].toString.apply(arguments));

    // Argument-shuffling
    if (arguments.length === 2) {
      value = y;
      y = y;
      x = x;
    }
    if (!this.testBounds(x, y)) {
      throw new Error("GameMap setTileValue called with invalid bounds " + x + ", " + y);
    }
    const tileIndex = this._calculateIndex(x, y);
    this._data[tileIndex].setValue(value);
  },
  setTileFlags(x: number, y: number, flags: number) {
    if (arguments.length < 2) throw new Error("GameMap setTileFlags called with too few arguments" + [].toString.apply(arguments));

    // Argument-shuffling
    if (arguments.length === 2) {
      flags = y;
      y = y;
      x = x;
    }
    if (!this.testBounds(x, y)) {
      throw new Error("GameMap setTileFlags called with invalid bounds " + x + ", " + y);
    }
    const tileIndex = this._calculateIndex(x, y);
    this._data[tileIndex].setFlags(flags);
  },
  addTileFlags(x: number, y: number, flags?: number | undefined) {
    if (arguments.length < 2) throw new Error("GameMap addTileFlags called with too few arguments" + [].toString.apply(arguments));

    // Argument-shuffling
    if (arguments.length === 2) {
      flags = y;
      y = y;
      x = x;
    }

    if (!this.testBounds(x, y)) {
      throw new Error("GameMap addTileFlags called with invalid bounds " + x + ", " + y);
    }
    const tileIndex = this._calculateIndex(x, y);
    this._data[tileIndex].addFlags(flags);
  },
  removeTileFlags(x: number, y: number, flags: number) {
    if (arguments.length < 2) throw new Error("GameMap removeTileFlags called with too few arguments" + [].toString.apply(arguments));

    // Argument-shuffling
    if (arguments.length === 2) {
      flags = y;
      y = y;
      x = x;
    }

    if (!this.testBounds(x, y)) {
      throw new Error("GameMap removeTileFlags called with invalid bounds " + x + ", " + y);
    }
    const tileIndex = this._calculateIndex(x, y);
    this._data[tileIndex].removeFlags(flags);
  },
  putZone(centreX: number, centreY: number, centreTile: number, size: number) {
    let x, y;
    if (!this.testBounds(centreX, this.cityCentreY) || !this.testBounds(centreX - 1 + size - 1, centreY - 1 + size - 1)) {
      throw new Error("GameMap putZone called with invalid bounds " + x + ", " + y);
    }
    let tile = centreTile - 1 - size;
    const startX = centreX - 1;
    const startY = centreY - 1;
    for (y = startY; y < startY + size; y++) {
      for (x = startX; x < startX + size; x++) {
        if (x === centreX && y === centreY) this.setTo(x, y, new Tile(tile, BNCNBIT | ZONEBIT));
        else this.setTo(x, y, new Tile(tile, BNCNBIT));
        tile += 1;
      }
    }
  },
  setTo(x: any, y: any, tile?: number | Tile | any | undefined) {
    // Argument-shuffling
    if (tile === undefined) {
      tile = y;
      y = x.y;
      x = x.x;
    }
    if (!this.testBounds(x, y)) {
      throw new Error("GameMap setTo called with invalid bounds " + x + ", " + y);
    }
    const tileIndex = this._calculateIndex(x, y);

    this._data[tileIndex] = tile;
  },
  _calculateIndex(x: number, y: number) {
    return x + y * this.width;
  },
  isPositionInBounds(pos: Position) {
    return this.bounds.contains(pos);
  },
  testBounds(x: number, y: number) {
    return this.isPositionInBounds(new Position(x, y));
  },
};
