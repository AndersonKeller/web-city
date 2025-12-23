import { EventEmitter } from "../utils/eventEmitter-ts";
import type { GameMap } from "../map/gameMap-ts";
import type { iSpriteManager } from "./spriteManager-ts";
export type iBaseSprite = typeof baseSpriteController;
export const baseSpriteController = {
  type: 0,
  frame: 0,
  map: null as GameMap,
  spriteManager: null as iSpriteManager,
  origX: 0,
  origY: 0,
  destX: 0,
  destY: 0,
  count: 0,
  soundCount: 0,
  dir: 0,
  newDir: 0,
  step: 0,
  flag: 0,
  turn: 0,
  accel: 0,
  speed: 100,
  worldX: 0,
  worldY: 0,
  xOffset: 0,
  yOffset: 0,
  x: 0,
  y: 0,
  width: 0,

  move: null as Function,
  base(spriteConstructor) {
    spriteConstructor.prototype = Object.create(this);
    EventEmitter(spriteConstructor);
    return spriteConstructor;
  },

  init(type: number, map: GameMap, spriteManager: iSpriteManager, x: number, y: number) {
    this.type = type;
    this.map = map;
    this.spriteManager = spriteManager;
    let pixX = x;
    let pixY = y;
    let worldX = x >> 4;
    // this.worldX = x >> 4;
    this.x = x;
    this.y = y;
    let worldY = y >> 4;
    // this.worldY = y >> 4;
    if (!Object.getOwnPropertyDescriptor(this, "x")) {
      Object.defineProperty(this, "x", {
        configurable: false,
        enumerable: true,
        set: function (val) {
          // XXX These getters have implicit knowledge of tileWidth: need to decide whether to disallow non 16px tiles
          pixX = val;
          worldX = val >> 4;
        },
        get: function () {
          return pixX;
        },
      });
    }
    if (!Object.getOwnPropertyDescriptor(this, "y")) {
      Object.defineProperty(this, "y", {
        configurable: false,
        enumerable: true,
        set: function (val) {
          pixY = val;
          worldY = val >> 4;
        },
        get: function () {
          return pixY;
        },
      });
    }
    if (!Object.getOwnPropertyDescriptor(this, "worldX")) {
      Object.defineProperty(this, "worldX", {
        configurable: false,
        enumerable: true,
        set: function (val) {
          worldX = val;

          pixX = val << 4;
        },
        get: function () {
          return worldX;
        },
      });
    }
    if (!Object.getOwnPropertyDescriptor(this, "worldY")) {
      Object.defineProperty(this, "worldY", {
        configurable: false,
        enumerable: true,
        set: function (val) {
          worldY = val;

          pixY = val << 4;
        },
        get: function () {
          return worldY;
        },
      });
    }
    this.origX = 0;
    this.origY = 0;
    this.destX = 0;
    this.destY = 0;
    this.count = 0;
    this.soundCount = 0;
    this.dir = 0;
    this.newDir = 0;
    this.step = 0;
    this.flag = 0;
    this.turn = 0;
    this.accel = 0;
    this.speed = 100;
    EventEmitter(this);
    return this;
  },
  getFileName() {
    return ["obj", this.type, "-", this.frame - 1].join("");
  },
  explodeSprite() {},
  spriteNotInBounds(xx?: number, yy?: number) {
    const x = xx ?? this.worldX;
    const y = yy ?? this.worldY;

    return x < 0 || y < 0 || x >= this.map.width || y >= this.map.height;
  },
};
