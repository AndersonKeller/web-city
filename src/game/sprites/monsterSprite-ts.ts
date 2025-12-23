import { notificationStore } from "../../stores/notification.store.ts";
import { baseSpriteController } from "./baseSprite-ts.ts";
import { EventEmitter } from "../utils/eventEmitter-ts.ts";
import type { GameMap } from "../map/gameMap-ts.ts";
import { SOUND_MONSTER, SPRITE_DYING } from "../utils/messages.ts";
import { miscUtilsController } from "../utils/miscUtils-ts.ts";
import { monsterCanvasController } from "../canvas/monsterCanvas.ts";
import { Random } from "../utils/random.ts";
import type { BlockMapSimulation } from "../simulation/simulation-ts.ts";
import * as SpriteConstants from "../utils/spriteConstants.ts";
import type { iSpriteManager } from "./spriteManager-ts.ts";
import { spriteUtilsController } from "./spriteUtils-ts.ts";
import { DIRT, RIVER, WATER_HIGH } from "../tiles/tileValues.ts";
export const monsterSpriteController = {
  base: null,
  width: 48,
  height: 48,
  xOffset: -24,
  yOffset: -24,
  frame: 0,
  flag: 0,
  count: 1000,
  destX: 0,
  destY: 0,
  origX: 0,
  origY: 0,
  _seenLand: false,
  xDelta: [2, 2, -2, -2, 0],
  yDelta: [-2, 2, 2, -2, 0],
  cardinals1: [0, 1, 2, 3],
  cardinals2: [1, 2, 3, 0],
  diagonals1: [2, 5, 8, 11],
  diagonals2: [11, 2, 5, 8],
  soundCount: 0,
  step: 0,
  x: 0,
  y: 0,
  map: null as GameMap,
  spriteManager: null as iSpriteManager,
  ID: miscUtilsController.makeConstantDescriptor(5),

  frames: miscUtilsController.makeConstantDescriptor(16),
  init(map: GameMap, spriteManager: iSpriteManager, x: number, y: number) {
    this.base = baseSpriteController.init(SpriteConstants.SPRITE_MONSTER, map, spriteManager, x, y);
    if (x > spriteUtilsController.worldToPix(map.width) / 2) {
      if (y > spriteUtilsController.worldToPix(map.height) / 2) this.frame = 10;
      else this.frame = 7;
    } else if (y > spriteUtilsController.worldToPix(map.height) / 2) {
      this.frame = 1;
    } else {
      this.frame = 4;
    }
    this.x = x;
    this.y = y;
    this.destX = spriteUtilsController.worldToPix(map.pollutionMaxX);
    this.destY = spriteUtilsController.worldToPix(map.pollutionMaxY);
    this.origX = this.x;
    this.origY = this.y;
    this._seenLand = false;
    this.map = map;
    this.spriteManager = spriteManager;
    EventEmitter(this);
    return { ...this.base, ...this };
  },
  move(spriteCycle: number, disasterManager: iSpriteManager, blockMaps: BlockMapSimulation) {
    if (this.soundCount > 0) this.soundCount--;
    // Frames 1 - 12 are diagonal sprites, 3 for each direction.
    // 1-3 NE, 2-6 SE, etc. 13-16 represent the cardinal directions.
    let currentDir = Math.floor((this.frame - 1) / 3);
    let frame, dir;
    if (currentDir < 4) {
      /* turn n s e w */
      // Calculate how far in the 3 step animation we were,
      // move on to the next one
      frame = (this.frame - 1) % 3;

      if (frame === 2) this.step = 0;

      if (frame === 0) this.step = 1;

      if (this.step) {
        frame++;
      } else {
        frame--;
      }
      const absDist = spriteUtilsController.absoluteDistance(this.x, this.y, this.destX, this.destY);
      if (absDist < 60) {
        if (this.flag === 0) {
          this.flag = 1;
          this.destX = this.origX;
          this.destY = this.origY;
        } else {
          frame = 0;
          this.base._emitEvent(SPRITE_DYING);
        }
      }
      // Perhaps switch to a cardinal direction
      dir = spriteUtilsController.getDir(this.x, this.y, this.destX, this.destY);
      dir = Math.floor((dir - 1) / 2);
      if (dir !== currentDir && Random.getChance(10)) {
        if (Random.getRandom16() & 1) frame = this.cardinals1[currentDir];
        else frame = this.cardinals2[currentDir];

        currentDir = 4;

        if (!this.soundCount) {
          this.base._emitEvent(SOUND_MONSTER);
          this.soundCount = 50 + Random.getRandom(100);
        }
      }
    } else {
      // Travelling in a cardinal direction. Switch to a diagonal
      currentDir = 4;
      dir = this.frame;
      frame = (dir - 13) & 3;
      if (!(Random.getRandom16() & 3)) {
        if (Random.getRandom16() & 1) frame = this.diagonals1[frame];
        else frame = this.diagonals2[frame];

        // We mung currentDir and frame here to
        // make the assignment below work
        currentDir = Math.floor((frame - 1) / 3);
        frame = (frame - 1) % 3;
      }
    }
    frame = currentDir * 3 + frame + 1;
    if (frame > 16) frame = 16;

    this.frame = frame;

    this.x += this.xDelta[currentDir];
    this.y += this.yDelta[currentDir];

    if (this.count > 0) this.count--;

    let tileValue = spriteUtilsController.getTileValue(this.map, this.x, this.y);
    if (tileValue === -1 || (tileValue === RIVER && this.count < 500)) this.frame = 0;

    if (tileValue === DIRT || tileValue > WATER_HIGH) this._seenLand = true;

    const spriteList = this.spriteManager.getSpriteList();
    for (let i = 0; i < spriteList.length; i++) {
      const sprite = spriteList[i];

      if (
        sprite.frame !== 0 &&
        (sprite.type === SpriteConstants.SPRITE_AIRPLANE ||
          sprite.type === SpriteConstants.SPRITE_HELICOPTER ||
          sprite.type === SpriteConstants.SPRITE_SHIP ||
          sprite.type === SpriteConstants.SPRITE_TRAIN) &&
        spriteUtilsController.checkSpriteCollision(this.base, sprite)
      )
        sprite.explodeSprite();
    }
    if (this.frame === 0) {
      this.base._emitEvent(SPRITE_DYING);
    }
    spriteUtilsController.destroyMapTile(this.spriteManager, this.map, blockMaps, this.x, this.y);
    this.base.worldX = this.x >> 4;
    this.base.worldY = this.y >> 4;

    notificationStore().setData({ x: this.base.worldX, y: this.base.worldY, sprite: this });
    monsterCanvasController.track(this.base.worldX, this.base.worldY, notificationStore().getData.sprite);
    // this._emitEvent(SPRITE_MOVED, { x: this.worldX, y: this.worldY });
  },
  addEventListener(message: string, subject: Function) {},
};