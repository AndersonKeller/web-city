import { baseSpriteController } from "./baseSprite-ts";
import type { iDisasterManager } from "../manager/disasterManager-ts";
import type { GameMap } from "../map/gameMap-ts";
import { PLANE_CRASHED } from "../utils/messages";
import { miscUtilsController } from "../utils/miscUtils-ts";
import { Random } from "../utils/random";
import type { BlockMapSimulation } from "../simulation/simulation-ts";
import { SPRITE_AIRPLANE, SPRITE_HELICOPTER } from "../utils/spriteConstants";
import type { iSpriteManager } from "./spriteManager-ts";
import { spriteUtilsController } from "./spriteUtils-ts";

export const airplaneSpriteController = {
  width: 48,
  height: 48,
  xOffset: -24,
  yOffset: -24,
  destX: 0,
  destY: 0,
  frame: 0,
  x: 0,
  y: 0,
  base: null,
  map: null as GameMap,
  spriteManager: null,
  xDelta: [0, 0, 6, 8, 6, 0, -6, -8, -6, 8, 8, 8],
  yDelta: [0, -8, -6, 0, 6, 8, 6, 0, -6, 0, 0, 0],
  ID: miscUtilsController.makeConstantDescriptor(3),
  frames: miscUtilsController.makeConstantDescriptor(11),
  init(map: GameMap, spriteManager: iSpriteManager, x: number, y: number) {
    baseSpriteController.base.bind(this);
    this.base = baseSpriteController.init(SPRITE_AIRPLANE, map, spriteManager, x, y);

    this.width = 48;
    this.height = 48;
    this.xOffset = -24;
    this.yOffset = -24;
    this.map = map;
    this.spriteManager = spriteManager;
    if (x > spriteUtilsController.worldToPix(map.width - 20)) {
      this.destX = x - 200;
      this.frame = 7;
    } else {
      this.destX = x + 200;
      this.frame = 11;
    }
    this.destY = y;
    this.x = x;
    this.y = y;
    return { ...this.base, ...this };
  },
  move(spriteCycle: number, disasterManager: iDisasterManager, _blockMaps: BlockMapSimulation) {
    let frame = this.frame;

    if (spriteCycle % 5 === 0) {
      // Frames > 8 mean the plane is taking off
      if (frame > 8) {
        frame--;
        if (frame < 9) {
          // Planes always take off to the east
          frame = 3;
        }
        this.frame = frame;
      } else {
        var d = spriteUtilsController.getDir(this.x, this.y, this.destX, this.destY);
        frame = spriteUtilsController.turnTo(frame, d);
        this.frame = frame;
      }
    }

    const absDist = spriteUtilsController.absoluteDistance(this.x, this.y, this.destX, this.destY);
    if (absDist < 50) {
      // We're pretty close to the destination
      this.destX = Random.getRandom(spriteUtilsController.worldToPix(this.map.width)) + 8;
      this.destY = Random.getRandom(spriteUtilsController.worldToPix(this.map.height)) + 8;
    }

    if (disasterManager.disastersEnabled) {
      let explode = false;

      const spriteList = this.spriteManager.getSpriteList();
      for (let i = 0; i < spriteList.length; i++) {
        const s = spriteList[i];

        if (s.frame === 0 || s === this) continue;

        if ((s.type === SPRITE_HELICOPTER || s.type === SPRITE_AIRPLANE) && spriteUtilsController.checkSpriteCollision(this.base, s)) {
          s.explodeSprite();
          explode = true;
        }
      }

      if (explode) {
        this.explodeSprite();
      }
    }

    this.x += this.xDelta[frame];
    this.y += this.yDelta[frame];

    if (this.base.spriteNotInBounds()) {
      this.frame = 0;
    }
  },
  explodeSprite() {
    this.frame = 0;
    this.spriteManager.makeExplosionAt(this.x, this.y);
    this.base._emitEvent(PLANE_CRASHED, {
      showable: true,
      x: this.base.worldX,
      y: this.base.worldY,
    });
  },
  addEventListener(_event: string, _subject: Function) {},
};
