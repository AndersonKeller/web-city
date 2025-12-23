import { baseSpriteController } from "./baseSprite-ts.ts";
import type { GameMap } from "../map/gameMap-ts.ts";
import type { iSpriteManager } from "./spriteManager-ts";
import * as SpriteConstants from "../utils/spriteConstants.ts";
import type { iDisasterManager } from "../manager/disasterManager-ts.ts";
import type { BlockMapSimulation } from "../simulation/simulation-ts.ts";
import { spriteUtilsController } from "./spriteUtils-ts";
import { Random } from "../utils/random.ts";
import { SPRITE_DYING, SPRITE_MOVED } from "../utils/messages.ts";
import { miscUtilsController } from "../utils/miscUtils-ts.ts";
export const tornadoSpriteController = {
  base: null,
  width: 48,
  height: 48,
  xOffset: -24,
  yOffset: -40,
  frame: 1,
  count: 200,
  xDelta: [2, 3, 2, 0, -2, -3],
  yDelta: [-2, 0, 2, 3, 2, 0],
  x: 0,
  y: 0,
  spriteManager: null as iSpriteManager,
  map: null as GameMap,
  ID: miscUtilsController.makeConstantDescriptor(6),

  frames: miscUtilsController.makeConstantDescriptor(3),
  worldX: 0,
  worldY: 0,
  init(map: GameMap, spriteManager: iSpriteManager, x: number, y: number) {
    this.base = baseSpriteController.init(SpriteConstants.SPRITE_TORNADO, map, spriteManager, x, y);
    this.spriteManager = spriteManager;
    this.x = x;
    this.y = y;
    this.map = map;
    this.worldX = x >> 4;
    this.worldY = y >> 4;
    return { ...this.base, ...this };
  },
  move(spriteCycle: number, disasterManager: iDisasterManager, blockMaps: BlockMapSimulation) {
    let frame = this.frame;
    // If middle frame, move right or left
    // depending on the flag value
    // If frame = 1, perhaps die based on flag
    // value
    if (frame === 2) {
      if (this.base.flag) {
        frame = 3;
      } else {
        frame = 1;
      }
    } else {
      if (frame === 1) {
        this.base.flag = 1;
      } else {
        this.base.flag = 0;
      }

      frame = 2;
    }
    if (this.count > 0) {
      this.count--;
    }
    this.frame = frame;
    const spriteList = this.spriteManager.getSpriteList();
    for (let i = 0; i < spriteList.length; i++) {
      const s = spriteList[i];

      // Explode vulnerable sprites
      if (
        s.frame !== 0 &&
        (s.type === SpriteConstants.SPRITE_AIRPLANE ||
          s.type === SpriteConstants.SPRITE_HELICOPTER ||
          s.type === SpriteConstants.SPRITE_SHIP ||
          s.type === SpriteConstants.SPRITE_TRAIN) &&
        spriteUtilsController.checkSpriteCollision(this.base, s)
      ) {
        s.explodeSprite();
      }
    }
    frame = Random.getRandom(5);
    this.x += this.xDelta[frame];
    this.y += this.yDelta[frame];
    if (this.base.spriteNotInBounds()) {
      this.frame = 0;
    }
    if (this.count !== 0 && Random.getRandom(500) === 0) {
      this.frame = 0;
    }

    if (this.frame === 0) {
      this.base._emitEvent(SPRITE_DYING);
    }
    spriteUtilsController.destroyMapTile(this.spriteManager, this.map, blockMaps, this.x, this.y);
    this.base._emitEvent(SPRITE_MOVED, { x: this.worldX, y: this.worldY });
  },
  addEventListener(message: string, subject: Function) {},
};