import type { GameMap } from "../map/gameMap-ts";

import type { iTyleSet } from "../tiles/tileSet-ts";

export type iSplashCanvas = typeof splashCanvasController;

export const splashCanvasController = {
  DEFAULT_ID: "SplashCanvas",
  DEFAULT_WIDTH: 360,
  DEFAULT_HEIGHT: 300,
  _canvas: null as HTMLCanvasElement,
  _tileSet: null as iTyleSet,
  create(parentID: string, tileSet: iTyleSet, id?: string | null) {
    id = id || this.DEFAULT_ID;
    if (parentID === undefined) throw new Error("No container specified");
    else if (tileSet === undefined) throw new Error("No tileset specified");
    else if (!tileSet.isValid) throw new Error("Tileset is not valid!");

    this._tileSet = tileSet;

    let parentNode = document.getElementById(parentID);

    if (parentNode === null) throw new Error("SplashCanvas container ID " + parentID + " not found");
    const height = this.DEFAULT_HEIGHT;
    const width = this.DEFAULT_WIDTH;

    // Create the canvas
    this._canvas = document.createElement("canvas");
    this._canvas.id = id;
    this._canvas.width = width;
    this._canvas.height = height;

    // Remove any existing element with the same id
    let existing = document.getElementById(id);
    if (existing !== null) {
      if (existing.parentNode === parentNode) {
        console.warn("There was already an object with the same ID as SplashCanvas - replacing it!");
        parentNode.replaceChild(this._canvas, existing);
      } else {
        console.warn("SplashCanvas id " + id + " already exists somewhere in document");
        throw new Error("ID " + id + " already exists in document!");
      }
    } else {
      parentNode.appendChild(this._canvas);
    }
    return this;
  },
  _paintTile(tileVal: number, x: number, y: number, ctx: CanvasRenderingContext2D) {
    const src = this._tileSet[tileVal];

    ctx.drawImage(src, x * 3, y * 3, 3, 3);
  },
  paint(map: GameMap) {
    const ctx = this._canvas.getContext("2d");
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.scale(0.5, 0.5);

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        this._paintTile(map.getTileValue(x, y), x, y, ctx);
      }
    }
  },
};
