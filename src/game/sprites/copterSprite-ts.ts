import { baseSpriteController } from "./baseSprite-ts";
import type { iDisasterManager } from "../manager/disasterManager-ts";
import type { GameMap } from "../map/gameMap-ts";
import { HEAVY_TRAFFIC, HELICOPTER_CRASHED, SOUND_HEAVY_TRAFFIC } from "../utils/messages";
import { miscUtilsController } from "../utils/miscUtils-ts";
import { Random } from "../utils/random";
import type { BlockMapSimulation } from "../simulation/simulation-ts";
import { SPRITE_HELICOPTER, SPRITE_MONSTER, SPRITE_TORNADO } from "../utils/spriteConstants";
import type { iSpriteManager } from "./spriteManager-ts";
import { spriteUtilsController } from "./spriteUtils-ts";

export const copterSpriteController = {
  base: null,
  width: 32,
  height: 32,
  xOffset: -16,
  yOffset: -16,
  frame: 5,
  count: 1500,
  destX: 0,
  destY: 0,
  origX: 0,
  origY: 0,
  xDelta: [0, 0, 3, 5, 3, 0, -3, -5, -3],
  yDelta: [0, -5, -3, 0, 3, 5, 3, 0, -3],
  x: 0,
  y: 0,
  spriteManager: null as iSpriteManager,
  soundCount: 0,
  map: null as GameMap,
  ID: miscUtilsController.makeConstantDescriptor(2),

  frames: miscUtilsController.makeConstantDescriptor(8),
  init(map: GameMap, spriteManager: iSpriteManager, x: number, y: number) {
    this.base = baseSpriteController.init(SPRITE_HELICOPTER, map, spriteManager, x, y);

    this.destX = Random.getRandom(spriteUtilsController.worldToPix(map.width)) + 8;
    this.destY = Random.getRandom(spriteUtilsController.worldToPix(map.height)) + 8;
    this.origX = x;
    this.origY = y;
    this.x = x;
    this.y = y;
    this.spriteManager = spriteManager;
    this.map = map;
    return { ...this.base, ...this };
  },
  addEventListener(_message: string, _subject: Function) {},
  move(spriteCycle: number, _disasterManager: iDisasterManager, blockMaps: BlockMapSimulation) {
    if (this.soundCount > 0) {
      this.soundCount--;
    }
    if (this.count > 0) {
      this.count--;
    }
    if (this.count === 0) {
      // Head towards a monster, and certain doom
      let s = this.spriteManager.getSprite(SPRITE_MONSTER);

      if (s !== null) {
        this.destX = s.x;
        this.destY = s.y;
      } else {
        // No monsters. Hm. I bet flying near that tornado is sensible
        s = this.spriteManager.getSprite(SPRITE_TORNADO);

        if (s !== null) {
          this.destX = s.x;
          this.destY = s.y;
        } else {
          this.destX = this.origX;
          this.destY = this.origY;
        }
      }
      // If near destination, let's get her on the ground
      const absDist = spriteUtilsController.absoluteDistance(this.x, this.y, this.origX, this.origY);
      if (absDist < 30) {
        this.frame = 0;
        return;
      }
    }
    if (this.soundCount === 0) {
      const x = this.base.worldX;
      const y = this.base.worldY;

      if (x >= 0 && x < this.map.width && y >= 0 && y < this.map.height) {
        if (blockMaps.trafficDensityMap.worldGet(x, y) > 170 && (Random.getRandom16() & 7) === 0) {
          this.base._emitEvent(HEAVY_TRAFFIC, { x: x, y: y });
          this.base._emitEvent(SOUND_HEAVY_TRAFFIC);
          this.soundCount = 200;
        }
      }
    }

    let frame = this.frame;

    if ((spriteCycle & 3) === 0) {
      const dir = spriteUtilsController.getDir(this.x, this.y, this.destX, this.destY);
      frame = spriteUtilsController.turnTo(frame, dir);
      this.frame = frame;
    }

    this.x += this.xDelta[frame];
    this.y += this.yDelta[frame];
  },
  explodeSprite() {
    this.frame = 0;
    this.spriteManager.makeExplosionAt(this.x, this.y);
    this.base._emitEvent(HELICOPTER_CRASHED, { x: this.base.worldX, y: this.base.worldY });
  },
};