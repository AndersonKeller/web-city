import { monsterStore } from "../../stores/monster.store";
import { animationManagerController, type iAnimationManager } from "../manager/animationManager-ts";

import type { GameMap } from "../map/gameMap-ts";
import { SPRITE_DYING, SPRITE_MOVED } from "../utils/messages";

import type { iTyleSet } from "../tiles/tileSet-ts";
import { TILE_INVALID } from "../tiles/tileValues";

export const monsterCanvasController = {
  _canvas: null as HTMLCanvasElement,
  _pendingTileSet: null as iTyleSet,
  _spriteSheet: null as HTMLImageElement,
  _tileSet: null as iTyleSet,
  _pendingDimensionChange: false,
  _allowScrolling: false,
  _map: null as GameMap,
  animationManager: null as iAnimationManager,
  _lastPaintedTiles: null,
  _currentPaintedTiles: [],
  _lastPaintedWidth: -1,
  _lastPaintedHeight: -1,
  _lastCanvasWidth: -1,
  _lastCanvasHeight: -1,
  ready: false,
  _wholeTilesInViewX: 0,
  _wholeTilesInViewY: 0,
  _totalTilesInViewX: 0,
  _totalTilesInViewY: 0,
  _originX: 0,
  _originY: 0,
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
  _lastCanvasData: null,
  canvasWidth: 0,
  canvasHeight: 0,
  _tracking: null,
  _timeout: null,
  TIMEOUT_SECS: 5,
  create(id: string, parentNode: any) {
    parentNode = document.getElementById(parentNode);
    this._canvas = document.createElement("canvas");
    const ctx = this._canvas.getContext("2d");
    ctx.scale(0.3, 0.25);
    this._canvas.id = id;
    // The canvas is assumed to fill its container on-screen
    const rect = parentNode.getBoundingClientRect();

    this._canvas.width = rect.width || 32;
    this._canvas.height = rect.height || 32;
    this._canvas.style.margin = "0";
    this._canvas.style.padding = "0";

    this._pendingTileSet = null;
    // Remove any existing element with the same id
    const current = document.getElementById(id);
    if (current !== null) {
      if (current.parentNode === parentNode) {
        parentNode.replaceChild(this._canvas, current);
      } else {
        throw new Error("ID " + id + " already exists in document!");
      }
    } else parentNode.appendChild(this._canvas);

    // this.ready = false;

    return this;
  },
  init(map: GameMap, tileSet: iTyleSet, spriteSheet: HTMLImageElement, animationManager: iAnimationManager) {
    animationManager = animationManager || animationManagerController.init(map);
    this._spriteSheet = spriteSheet;
    this._tileSet = tileSet;
    const w = this._tileSet.tileWidth;
    this._map = map;
    this.animationManager = animationManagerController.init(map);
    if (this._canvas.width < w || this._canvas.height < w) {
      throw new Error("Canvas too small!");
    }
    // Whether to allow off-map scrolling
    this._allowScrolling = true;
    // An array indexed by tile offset containing the tileValue last painted there
    this._lastPaintedTiles = null;
    this._currentPaintedTiles = []; // for future use

    // Last time we painted, the canvas was this many tiles wide and tall
    this._lastPaintedWidth = -1;
    this._lastPaintedHeight = -1;

    // Last time we painted, the canvas was this wide and tall in pixels (determines whether we
    // can safely call putImageData)
    this._lastCanvasWidth = -1;
    this._lastCanvasHeight = -1;
    this.canvasWidth = this._canvas.width;
    this.canvasHeight = this._canvas.height;

    // After painting  tiles, we store the image data here before painting sprites and mousebox
    this._lastCanvasData = null;

    this._calculateDimensions();

    // Have the dimensions changed since the last paint?
    this._pendingDimensionChange = false;
    const onResize = () => {
      this._pendingDimensionChange = true;
    };
    onResize();

    // Recompute canvas dimensions on resize
    window.addEventListener("resize", onResize, false);

    // Order is important here. ready must be set before the call to centreOn below
    this.ready = true;
    this.centreOn(Math.floor(this._map.width / 2), Math.floor(this._map.height / 2));
    // this.centreOn(290, 133);
    this.paint();
  },
  _calculateDimensions(force: boolean = false) {
    const canvasWidth = (this.canvasWidth = this._canvas.parentElement.clientWidth);
    const canvasHeight = (this.canvasHeight = this._canvas.parentElement.clientHeight);

    if (canvasHeight === this._lastCanvasHeight && canvasWidth === this._lastCanvasWidth && !force) {
      return;
    }

    this._canvas.width = canvasWidth;
    this._canvas.height = canvasHeight;

    let w = this._tileSet.tileWidth;

    // How many tiles fit?
    this._wholeTilesInViewX = Math.floor(canvasWidth / w);
    this._wholeTilesInViewY = Math.floor(canvasHeight / w);
    this._totalTilesInViewX = Math.ceil(canvasWidth / w);
    this._totalTilesInViewY = Math.ceil(canvasHeight / w);

    if (this._allowScrolling) {
      // The min/max properties denote how far we will let the canvas' origin move: the map
      // should be visible in at least half the canvas
      this.minX = 0 - Math.ceil(Math.floor(canvasWidth / w) / 2);
      this.maxX = this._map.width - 1 - Math.ceil(Math.floor(canvasWidth / w) / 2);
      this.minY = 0 - Math.ceil(Math.floor(canvasHeight / w) / 2);
      this.maxY = this._map.height - 1 - Math.ceil(Math.floor(canvasHeight / w) / 2);
      this._totalTilesInViewY = Math.ceil(canvasHeight / w);
    } else {
      this.minX = 0;
      this.minY = 0;
      this.maxX = this._map.width - this._totalTilesInViewX;
      this.maxY = this._map.height - this._totalTilesInViewY;
    }
    this._pendingDimensionChange = true;
  },
  paint(isPaused?: boolean) {
    let i, l, x, y, row, damaged, xBound, yBound, index;
    if (!this.ready) throw new Error("Not ready!");

    const ctx = this._canvas.getContext("2d");
    ctx.scale(0.3, 0.25);
    let lastPaintedTiles = this._lastPaintedTiles;

    // Recompute our dimensions if there has been a resize since last paint
    if (this._pendingDimensionChange || this._pendingTileSet) {
      this._calculateDimensions();
      this._pendingDimensionChange = false;

      // Change tileSet if necessary
      if (this._pendingTileSet !== null) this._tileSet = this._pendingTileSet;
      // If the dimensions or tileset has changed, set each entry in lastPaintedTiles to a bogus value to force a
      // repaint. Note: we use -2 as our bogus value; -1 would paint the black void
      if (this._pendingTileSet || this.canvasWidth !== this._lastCanvasWidth || this.canvasHeight !== this._lastCanvasHeight) {
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        for (y = 0, l = lastPaintedTiles !== null ? lastPaintedTiles.length : 0; y < l; y++) {
          lastPaintedTiles[y] = -2;
        }
      }
      this._pendingTileSet = null;
    }
    const paintWidth = this._totalTilesInViewX;
    const paintHeight = this._totalTilesInViewY;
    // Fill an array with the values we need to paint

    const tileValues = this._map.getTileValuesForPainting(this._originX, this._originY, paintWidth, paintHeight, this._currentPaintedTiles);
    // Adjust for animations
    this.animationManager.getTiles(tileValues, this._originX, this._originY, paintWidth, paintHeight, isPaused);
    this._paintTiles(ctx, tileValues);

    // The _paintTiles call updates this._lastPaintedTiles. Update our cached copy
    lastPaintedTiles = this._lastPaintedTiles;

    // Stash various values for next paint
    this._lastCanvasWidth = this.canvasWidth;
    this._lastCanvasHeight = this.canvasHeight;
  },
  _paintTiles(ctx: CanvasRenderingContext2D, paintData: number[]) {
    let x, y, row, index;
    const lastPaintedTiles = this._lastPaintedTiles;

    const width = this._totalTilesInViewX;
    const height = this._totalTilesInViewY;
    if (lastPaintedTiles !== null) {
      // We have painted the canvas before. There are 3 possibilities:
      //  - The canvas is exactly the same size as last time we painted
      //  - The canvas has grown
      //  - The canvas has shrunk
      //
      // In any case, we want to find the minimal area that was onscreen last paint
      // and this paint, and iterate over those tiles, repainting where necessary
      const xBound = Math.min(this._lastPaintedWidth, width);
      const yBound = Math.min(this._lastPaintedHeight, height);
      // Loop over the common area that we painted last time. Compare the current value against what was there last time
      for (y = 0; y < yBound; y++) {
        for (x = 0; x < xBound; x++) {
          index = y * xBound + x;
          if (lastPaintedTiles[index] === paintData[index]) continue;

          // Tile is different: repaint
          this._paintOne(ctx, paintData[index], x, y);
        }
      }

      // Do we have more tiles than before? Paint the extra width and/or the extra height
      if (width > this._lastPaintedWidth) {
        for (y = 0; y < height; y++) {
          for (x = this._lastPaintedWidth; x < width; x++) {
            index = y * width + x;
            this._paintOne(ctx, paintData[index], x, y);
          }
        }
      }
      if (height > this._lastPaintedHeight) {
        for (y = this._lastPaintedHeight; y < height; y++) {
          for (x = 0; x < width; x++) {
            index = y * width + x;
            this._paintOne(ctx, paintData[index], x, y);
          }
        }
      }
    } else {
      // Full paint
      for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
          index = y * width + x;
          this._paintOne(ctx, paintData[index], x, y);
        }
      }
    }
    // Stash data
    this._lastPaintedWidth = width;
    this._lastPaintedHeight = height;

    // Rotate tile data
    const temp = this._lastPaintedTiles;
    this._lastPaintedTiles = paintData;
    this._currentPaintedTiles = temp;
  },
  _paintOne(ctx: CanvasRenderingContext2D, tileVal: number, x: number, y: number) {
    if (tileVal === TILE_INVALID) {
      this._paintVoid(ctx, x, y);
      return;
    }

    if (this._tileSet) {
      const src = this._tileSet[tileVal];
      try {
        ctx.drawImage(src, x * this._tileSet.tileWidth, y * this._tileSet.tileWidth);
      } catch (e) {
        var mapX = this._originX + x;
        var mapY = this._originY + y;
        throw new Error(
          "Failed to draw tile " +
            tileVal +
            " at " +
            x +
            ", " +
            y +
            " (map " +
            mapX +
            ", " +
            mapY +
            " tile " +
            (this._map.testBounds(mapX, mapY) ? this._map.getTileValue(mapX, mapY) : "?? (Out of bounds)") +
            ")",
        );
      }
    }
  },
  _paintVoid(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const w = this._tileSet.tileWidth;
    ctx.fillStyle = "black";
    ctx.fillRect(x * w, y * w, w, w);
  },
  centreOn(x: number, y: number) {
    // if (!this.ready) throw new Error("Not ready!");

    // XXX Need to fix so that centres on best point if bounds fall outside
    // XXX min/max
    let originX = Math.floor(x) - Math.ceil(this._wholeTilesInViewX / 2);
    let originY = Math.floor(y) - Math.ceil(this._wholeTilesInViewY / 2);
    if (originX > this.maxX) originX = this.maxX;
    if (originX < this.minX) originX = this.minX;
    if (originY > this.maxY) originY = this.maxY;
    if (originY < this.minY) originY = this.minY;

    this._originX += originX;
    this._originY += originY;
  },
  disallowOffMap() {
    this._allowScrolling = false;
    this._lastPaintedTiles = null;
    this._calculateDimensions(true);
  },
  track(x: number, y: number, sprite) {
    if (this._tracking !== null) {
      this._tracking.removeEventListener(SPRITE_MOVED, this._onMove);
      this._tracking.removeEventListener(SPRITE_DYING, this._onDie);
    }
    if (!this._tracking) {
      this._tracking = sprite;

      this._tracking.addEventListener(SPRITE_MOVED, (e) => {
        this.centreOn(e.x, e.y);
        // this._onMove(e);
      });
      this._tracking.addEventListener(SPRITE_DYING, (e) => {
        this._onDie(e);
      });
    }
    this.centreOn(x, y);

    if (this._timeout !== null) {
      window.clearTimeout(this._timeout);
      this._timeout = null;
    }
  },
  _onMove(event: any) {
    const min = this.getTileOrigin();
    const max = this.getMaxTile();

    if (event.x < min.x || event.y < min.y || event.x >= max.x || event.y >= max.y) {
      this.centreOn(event.x, event.y);
    } else {
      this.centreOn(event.x, event.y);
    }
  },
  _onDie(event) {
    this._tracking.removeEventListener(SPRITE_MOVED, this._onMove);
    this._tracking.removeEventListener(SPRITE_DYING, this._onDie);
    this._tracking = null;

    this._timeout = window.setTimeout(() => {
      this._timeout = null;
      monsterStore().setOpenTv(false);
    }, this.TIMEOUT_SECS * 1000);
  },
  getTileOrigin(): { x: number; y: number } {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    return { x: this._originX, y: this._originY };
  },
  getMaxTile(): { x: number; y: number } {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    return {
      x: this._originX + this._totalTilesInViewX - 1,
      y: this._originY + this._totalTilesInViewY - 1,
    };
  },
};
