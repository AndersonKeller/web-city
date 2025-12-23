import { baseSpriteController } from "./baseSprite-ts.ts";
import type { GameMap } from "../map/gameMap-ts.ts";
import { TRAIN_CRASHED } from "../utils/messages.ts";
import { miscUtilsController } from "../utils/miscUtils-ts.ts";
import { Random } from "../utils/random.ts";
import type { BlockMapSimulation } from "../simulation/simulation-ts.ts";
import { SPRITE_TRAIN } from "../utils/spriteConstants.ts";
import type { iSpriteManager } from "./spriteManager-ts";
import { spriteUtilsController } from "./spriteUtils-ts";
import * as TileValues from "../tiles/tileValues.ts";
export const trainSpriteController = {
  width: 32,
  height: 32,
  xOffset: -16,
  yOffset: -16,
  frame: 1,
  dir: 4,
  base: null,
  tileDeltaX: [0, 16, 0, -16],
  tileDeltaY: [-16, 0, 16, 0],
  xDelta: [0, 4, 0, -4, 0],
  yDelta: [-4, 0, 4, 0, 0],
  TrainPic2: [1, 2, 1, 2, 5],
  map: null as GameMap,
  // Frame values
  NORTHSOUTH: 1,
  EASTWEST: 2,
  NWSE: 3,
  NESW: 4,
  UNDERWATER: 5,

  // Direction values
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3,
  CANTMOVE: 4,
  x: 0,
  y: 0,
  spriteManager: null,
  ID: miscUtilsController.makeConstantDescriptor(1),

  frames: miscUtilsController.makeConstantDescriptor(5),
  init(map: GameMap, spriteManager: iSpriteManager, x: number, y: number) {
    this.base = baseSpriteController.init(SPRITE_TRAIN, map, spriteManager, x, y);
    this.width = 32;
    this.height = 32;
    this.xOffset = -16;
    this.yOffset = -16;
    this.frame = 1;
    this.dir = 4;
    this.x = x;
    this.y = y;
    this.map = map;
    this.spriteManager = spriteManager;

    return { ...this.base, ...this };
  },
  move(spriteCycle: number, disasterManager: iSpriteManager, blockMaps: BlockMapSimulation) {
    // Trains can only move in the 4 cardinal directions
    // Over the course of 4 frames, we move through a tile, so
    // ever fourth frame, we try to find a direction to move in
    // (excluding the opposite direction from the current direction
    // of travel). If there is no possible direction found, our direction
    // is d to CANTMOVE. (Thus, if we're in a dead end, we can start heading
    // backwards next time round). If we fail to find a destination after 2 attempts,
    // we die.
    if (this.frame === this.NWSE || this.frame === this.NESW) {
      this.frame = this.TrainPic2[this.dir];
    }

    this.x += this.xDelta[this.dir];
    this.y += this.yDelta[this.dir];
    // Find a new direction.
    if ((spriteCycle & 3) === 0) {
      // Choose a random starting point for our search
      const dir = Random.getRandom16() & 3;
      for (let i = dir; i < dir + 4; i++) {
        const dir2 = i & 3;
        if (this.dir !== this.CANTMOVE) {
          //avoid the opposite direction
          if (dir2 === ((this.dir + 2) & 3)) {
            continue;
          }
        }
        const tileValue = spriteUtilsController.getTileValue(this.map, this.x + this.tileDeltaX[dir2], this.y + this.tileDeltaY[dir2]);
        if (
          (tileValue >= TileValues.RAILBASE && tileValue <= TileValues.LASTRAIL) ||
          tileValue === TileValues.RAILVPOWERH ||
          tileValue === TileValues.RAILHPOWERV
        ) {
          if (this.dir !== dir2 && this.dir !== this.CANTMOVE) {
            if (this.dir + dir2 === this.WEST) {
              this.frame = this.NWSE;
            } else {
              this.frame = this.NESW;
            }
          } else {
            this.frame = this.TrainPic2[dir2];
          }
          if (tileValue === TileValues.HRAIL || tileValue === TileValues.VRAIL) {
            this.frame = this.UNDERWATER;
          }
          this.dir = dir2;
          return;
        }
      }
      // Nowhere to go. Die.
      if (this.dir === this.CANTMOVE) {
        this.frame = 0;
        return;
      }
      // We didn't find a direction this time. We'll try the opposite
      // next time around
      this.dir = this.CANTMOVE;
    }
  },
  explodeSprite() {
    this.frame = 0;
    this.spriteManager.makeExplosionAt(this.x, this.y);
    this.base._emitEvent(TRAIN_CRASHED, {
      showable: true,
      x: this.base.worldX,
      y: this.base.worldY,
    });
  },
  addEventListener(message: string, subject: Function) {},
};