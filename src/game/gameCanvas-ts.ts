import type { GameMap } from "./map/gameMap-ts";
// import { AnimationManager } from "./animationManager";
import type { iTyleSet } from "./tiles/tileSet-ts";
import { TILE_INVALID } from "./tiles/tileValues";
// import { MouseBox } from "./mouseBox";
import { Position } from "./utils/position";
import { mouseBoxController } from "./mouseBox-ts";
import { animationManagerController, type iAnimationManager } from "./manager/animationManager-ts";
export type iGameCanvas = typeof gameCanvasController;
export const gameCanvasController = {
  DEFAULT_ID: "webCityCanvas",
  _canvas: null as HTMLCanvasElement,
  _pendingTileSet: null as iTyleSet,
  ready: false,
  _tileSet: null as iTyleSet,
  _map: null as GameMap,
  _spriteSheet: null as HTMLImageElement,
  animationManager: null as iAnimationManager,
  _allowScrolling: false,
  _lastPaintedTiles: null,
  _currentPaintedTiles: [],
  _lastPaintedWidth: -1,
  _lastPaintedHeight: -1,
  _lastCanvasWidth: -1,
  _lastCanvasHeight: -1,
  _lastCanvasData: null,
  _wholeTilesInViewX: 0,
  _wholeTilesInViewY: 0,
  _totalTilesInViewX: 0,
  _totalTilesInViewY: 0,
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0,
  _pendingDimensionChange: false,
  _originX: 0,
  _originY: 0,
  canvasWidth: 0,
  canvasHeight: 0,

  create(id: string, parentNode?: any | undefined) {
    // Argument shuffling

    if (parentNode === undefined) {
      // No ID supplied
      parentNode = id;
      id = this.DEFAULT_ID;
    }
    const orig = parentNode;

    parentNode = document.getElementById(parentNode);
    if (typeof parentNode === "string") {
      parentNode = document.getElementById(parentNode);
      parentNode = parentNode.length === 0 ? null : parentNode[0];
      if (parentNode === null) {
        throw new Error("Node " + orig + " not found");
      }
    }

    this._canvas = document.createElement("canvas");
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

    this.ready = false;

    return this;
  },
  init(map: GameMap, tileSet: iTyleSet, spriteSheet: HTMLImageElement, animationManager?: iAnimationManager) {
    animationManager = animationManager || animationManagerController.init(map);
    if (arguments.length < 3) {
      throw new Error("GameCanvas constructor called with too few arguments " + [].toString.apply(arguments));
    }
    if (tileSet && !tileSet.isValid) {
      throw new Error("TileSet not ready!");
    }

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

    // After painting tiles, we store the image data here before painting sprites and mousebox
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

    this.paint(null, null);
  },
  centreOn(x: number, y: number) {
    if (!this.ready) throw new Error("Not ready!");

    // XXX Need to fix so that centres on best point if bounds fall outside
    // XXX min/max
    let originX = Math.floor(x) - Math.ceil(this._wholeTilesInViewX / 2);
    let originY = Math.floor(y) - Math.ceil(this._wholeTilesInViewY / 2);
    if (originX > this.maxX) originX = this.maxX;
    if (originX < this.minX) originX = this.minX;
    if (originY > this.maxY) originY = this.maxY;
    if (originY < this.minY) originY = this.minY;

    this._originX = originX;
    this._originY = originY;
  },
  paint(mouse?: any, sprites?: HTMLImageElement[], isPaused?: boolean) {
    let i, l, x, y, row, damaged, xBound, yBound, index;
    if (!this.ready) throw new Error("Not ready!");

    const ctx = this._canvas.getContext("2d");
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

    if (!mouse && !sprites) {
      return;
    }

    if (mouse) {
      damaged = this._processMouse(mouse);
      // console.log(damaged, "mouse? canvas ts");
      if (damaged) {
        for (y = Math.max(0, damaged.y), yBound = Math.min(paintHeight, damaged.yBound); y < yBound; y++) {
          for (x = Math.max(0, damaged.x), xBound = Math.min(paintWidth, damaged.xBound); x < xBound; x++) {
            index = [y * paintWidth + x];
            // Note: we can't use TILE_INVALID (-1) as that in some sense is a valid tile for the void!
            lastPaintedTiles[index] = -2;
          }
        }
      }
    }
    if (sprites) {
      damaged = this._processSprites(ctx, sprites);
      for (i = 0, l = damaged.length; i < l; i++) {
        const damagedArea = damaged[i];
        for (y = Math.max(0, damagedArea.y), yBound = Math.min(damagedArea.yBound, paintHeight); y < yBound; y++) {
          for (x = Math.max(0, damagedArea.x), xBound = Math.min(damagedArea.xBound, paintWidth); x < xBound; x++) {
            index = [y * paintWidth + x];
            this._lastPaintedTiles[index] = -2;
          }
        }
      }
    }
  },
  _processSprites(ctx: CanvasRenderingContext2D, spriteList: any[]) {
    const spriteDamage = [];
    const tileWidth = this._tileSet.tileWidth;
    for (let i = 0, l = spriteList.length; i < l; i++) {
      let sprite = spriteList[i];
      try {
        ctx.drawImage(
          this._spriteSheet,
          (sprite.frame - 1) * 48,
          (sprite.type - 1) * 48,
          sprite.width,
          sprite.width,
          sprite.x + sprite.xOffset - this._originX * 16,
          sprite.y + sprite.yOffset - this._originY * 16,
          sprite.width,
          sprite.width,
        );
      } catch (error) {
        throw new Error("Failed to draw sprite " + sprite.type + " frame " + sprite.frame + " at " + sprite.x + ", " + sprite.y);
      }
      // sprite values are in pixels
      spriteDamage.push({
        x: Math.floor((sprite.x + sprite.xOffset - this._originX * 16) / tileWidth),
        xBound: Math.ceil((sprite.x + sprite.xOffset + sprite.width - this._originX * 16) / tileWidth),
        y: Math.floor((sprite.y + sprite.yOffset - this._originY * 16) / tileWidth),
        yBound: Math.ceil((sprite.y + sprite.yOffset + sprite.height - this._originY * 16) / tileWidth),
      });
    }

    return spriteDamage;
  },
  _processMouse(mouse) {
    const damage = { x: 0, xBound: 0, y: 0, yBound: 0 };
    const self = this;
    const exec = function (mouse) {
      if (!mouse) {
        return;
      }
      if (mouse) {
        if (mouse.width === 0 || mouse.height === 0) return;
      }
      // For outlines bigger than 2x2 (in either dimension) assume the mouse is offset by
      // one tile
      let mouseX = mouse.x;
      let mouseY = mouse.y;
      const mouseWidth = mouse.width;
      const mouseHeight = mouse.height;
      const options = { colour: mouse.colour, outline: true };

      if (mouseWidth > 2) mouseX -= 1;
      if (mouseHeight > 2) mouseY -= 1;

      const offMap =
        (self._originX + mouseX < 0 && self._originX + mouseX + mouseWidth <= 0) ||
        (self._originY + mouseY < 0 && self._originY + mouseY + mouseHeight <= 0) ||
        self._originX + mouseX >= self._map.width ||
        self._originY + mouseY >= self._map.height;

      if (offMap) {
        damage.x = damage.xBound = mouseX;
        damage.y = damage.yBound = mouseY;

        return damage;
      }
      const pos = {
        x: mouseX * self._tileSet.tileWidth,
        y: mouseY * self._tileSet.tileWidth,
      };
      const width = mouseWidth * self._tileSet.tileWidth;
      const height = mouseHeight * self._tileSet.tileWidth;

      mouseBoxController.draw(self._canvas, pos, width, height, options);

      // Return an object representing tiles that were damaged that will need redrawn
      // Note that we must take an extra tile either side to account for the outline
      damage.x = mouseX - 1;
      damage.xBound = mouseX + mouseWidth + 2;
      damage.y = mouseY - 1;
      damage.yBound = mouseY + mouseWidth + 2;
      return damage;
    };
    return exec(mouse);
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
  disallowOffMap() {
    this._allowScrolling = false;
    this._lastPaintedTiles = null;
    this._calculateDimensions(true);
  },
  moveNorth() {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    if (this._originY > this.minY) {
      this._originY--;
    }
  },
  moveEast() {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    if (this._originX < this.maxX) {
      this._originX++;
    }
  },
  moveSouth() {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    if (this._originY < this.maxY) {
      this._originY++;
    }
  },
  moveWest() {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    if (this._originX > this.minX) {
      this._originX--;
    }
  },
  moveTo(x: number, y: number) {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    if (x < this.minX || x > this.maxX || y < this.minY || y > this.maxY) {
      throw new Error("Coordinates out of bounds");
    }
    this._originX = x;
    this._originY = y;
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
  canvasCoordinateToTileOffset(x: number, y: number): { x: number; y: number } {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    return {
      x: Math.floor(x / this._tileSet.tileWidth),
      y: Math.floor(y / this._tileSet.tileWidth),
    };
  },
  canvasCoordinateToTileCoordinate(x: number, y: number): { x: number; y: number } | null {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    if (x >= this.canvasWidth || y >= this.canvasHeight) {
      return null;
    }
    return {
      x: this._originX + Math.floor(x / this._tileSet.tileWidth),
      y: this._originY + Math.floor(y / this._tileSet.tileWidth),
    };
  },
  canvasCoordinateToPosition(x: number, y: number): Position | null {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    if (x >= this.canvasWidth || y >= this.canvasHeight) {
      return null;
    }
    x = this._originX + Math.floor(x / this._tileSet.tileWidth);
    y = this._originY + Math.floor(y / this._tileSet.tileWidth);
    if (x < 0 || x >= this._map.width || y < 0 || y >= this._map.height) {
      return null;
    }
    return new Position(x, y);
  },
  positionToCanvasCoordinate(position: Position): Position | null {
    return this.tileToCanvasCoordinate(position);
  },
  tileToCanvasCoordinate(position: Position): Position | null {
    if (!this.ready) {
      throw new Error("Not ready!");
    }
    if (
      position.x < this.minX ||
      position.y < this.minY ||
      position.x > this.maxX + this._totalTilesInViewX - 1 ||
      position.y > this.maxY + this._totalTilesInViewY - 1
    ) {
      throw new Error("Not ready!");
    }
    if (
      position.x < this._originX ||
      position.x >= this._originX + this._totalTilesInViewX ||
      position.y < this._originY ||
      position.y >= this._originY + this._totalTilesInViewY
    ) {
      return null;
    }
    return {
      x: (position.x - this._originX) * this._tileSet.tileWidth,
      y: (position.y - this._originY) * this._tileSet.tileWidth,
    };
  },
  changeTileSet(tileSet: iTyleSet): void {
    if (!tileSet.isValid) {
      throw new Error("new tileset not loaded");
    }
    this._pendingTileSet = tileSet;
  },
  _screenshot(onlyVisible: boolean): string {
    if (onlyVisible) {
      return this._canvas.toDataURL();
    }
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this._map.width * this._tileSet.tileWidth;
    tempCanvas.height = this._map.height * this._tileSet.tileWidth;
    const ctx = tempCanvas.getContext("2d");

    for (let x = 0; x < this._map.width; x++) {
      for (let y = 0; y < this._map.height; y++) {
        this._paintOne(ctx, this._map.getTileValue(x, y), x, y);
      }
    }

    return tempCanvas.toDataURL();
  },
  screenshotMap(): string {
    return this._screenshot(false);
  },
  screenshotVisible(): string {
    return this._screenshot(true);
  },
  shoogle() {
    // TODO Earthquakes
  },
};
