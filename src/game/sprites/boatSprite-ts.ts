import { baseSpriteController } from "./baseSprite-ts.ts";

import type { iDisasterManager } from "../manager/disasterManager-ts.ts";

import type { GameMap } from "../map/gameMap-ts.ts";
import { SHIP_CRASHED, SOUND_HONKHONK } from "../utils/messages.ts";
import { miscUtilsController } from "../utils/miscUtils-ts.ts";
import { Random } from "../utils/random.ts";
import type { BlockMapSimulation } from "../simulation/simulation-ts.ts";
import { SPRITE_SHIP } from "../utils/spriteConstants.ts";

import { spriteUtilsController } from "./spriteUtils-ts.ts";
import * as TileValues from "../tiles/tileValues.ts";

export const boatSpriteController = {
  width: 48,
  height: 48,
  xOffset: -24,
  yOffset: -24,
  frame: 0,
  base: null,
  newDir: 0,
  dir: 10,
  count: 1,
  map: null as GameMap,
  tileDeltaX: [0, 0, 1, 1, 1, 0, -1, -1, -1],
  tileDeltaY: [0, -1, -1, 0, 1, 1, 1, 0, -1],
  xDelta: [0, 0, 2, 2, 2, 0, -2, -2, -2],
  yDelta: [0, -2, -2, 0, 2, 2, 2, 0, -2],
  tileWhiteList: [
    TileValues.RIVER,
    TileValues.CHANNEL,
    TileValues.POWERBASE,
    TileValues.POWERBASE + 1,
    TileValues.RAILBASE,
    TileValues.RAILBASE + 1,
    TileValues.BRWH,
    TileValues.BRWV,
  ],
  CANTMOVE: 10,
  soundCount: 0,
  x: 0,
  y: 0,
  worldX: 0,
  worldY: 0,
  spriteManager: null,
  ID: miscUtilsController.makeConstantDescriptor(4),

  frames: miscUtilsController.makeConstantDescriptor(8),
  init(map: GameMap, spriteManager, x: number, y: number) {
    this.base = baseSpriteController.init(SPRITE_SHIP, map, spriteManager, x, y);
    this.map = map;

    this.spriteManager = spriteManager;
    if (x < spriteUtilsController.worldToPix(4)) {
      this.frame = 3;
    } else if (x >= spriteUtilsController.worldToPix(map.width - 4)) {
      this.frame = 7;
    } else if (y < spriteUtilsController.worldToPix(4)) {
      this.frame = 5;
    } else if (y >= spriteUtilsController.worldToPix(map.height - 4)) {
      this.frame = 1;
    } else {
      this.frame = 3;
    }

    this.x = x; //>> 4; //>> 4;
    this.y = y; //>> 4; //>> 4;

    this.worldX = x >> 4;
    this.worldY = y >> 4;
    this.newDir = this.frame;

    // this.x = this.base.worldX; // >> 4;
    // this.y = this.base.worldY; //>> 4;
    // this.base.origX = this.x;
    // this.base.origY = this.y;

    return { ...this.base, ...this };
  },
  oppositeAndUnderwater(tileValue: number, oldDir: number, newDir: number) {
    let opposite = oldDir + 4;
    // console.log(oldDir, newDir, "old and new");
    if (opposite > 8) {
      opposite -= 8;
    }
    if (newDir != opposite) {
      return false;
    }
    if (
      tileValue == TileValues.POWERBASE ||
      tileValue == TileValues.POWERBASE + 1 ||
      tileValue == TileValues.RAILBASE ||
      tileValue == TileValues.RAILBASE + 1
    ) {
      return true;
    }
    return false;
  },
  move(spriteCycle: number, disasterManager: iDisasterManager, blockMaps: BlockMapSimulation) {
    var tile = TileValues.RIVER;
    // this.explodeSprite();
    var frame, xx, yy;
    if (this.soundCount > 0) {
      this.soundCount--;
    }
    if (this.soundCount === 0) {
      if ((Random.getRandom16() & 3) === 1) {
        this.base._emitEvent(SOUND_HONKHONK);
      }
      this.soundCount = 200;
    }

    if (this.count > 0) {
      this.count--;
    }

    xx = this.worldX; //+ this.tileDeltaX[frame];
    yy = this.worldY; //+ this.tileDeltaX[frame];
    if (this.count === 0) {
      // Ships turn slowly: only 45° every 9 cycles
      this.count = 9;
      // If already executing a turn, continue to do so
      if (this.frame !== this.newDir) {
        this.frame = spriteUtilsController.turnTo(this.frame, this.newDir);
        return;
      }
      // Otherwise pick a new direction
      // Choose a random starting direction to search from
      // 0 = N, 1 = NE, ... 7 = NW
      var startDir = Random.getRandom16() & 7;
      let dirinitial = startDir;
      for (var dir = startDir; dir < startDir + 8; dir++) {
        frame = (dir & 7) + 1;
        if (frame === this.dir) {
          continue;
        }
        xx = this.worldX + this.tileDeltaX[frame];
        yy = this.worldY + this.tileDeltaX[frame];

        if (this.map.testBounds(xx, yy)) {
          // this.worldX += this.tileDeltaX[frame]; //= xx; //this.x >> 4; //>> 4; //>> 4;
          // this.worldY += this.tileDeltaX[frame]; // = yy; //this.y << 4; //<< 4; //>> 4;
          tile = this.map.getTileValue(xx, yy);
          // this.base.worldX = xx;
          // this.base.worldY = yy;
          //   console.log(tile, "tile testbounds");
          if (
            tile === TileValues.CHANNEL ||
            tile === TileValues.BRWH ||
            tile === TileValues.BRWV ||
            this.oppositeAndUnderwater(tile, this.dir, frame)
          ) {
            this.newDir = frame;
            this.frame = spriteUtilsController.turnTo(this.frame, this.newDir);
            this.dir = frame + 4;

            if (this.dir > 8) {
              this.dir -= 8;
            }

            break;
          }
        }
      }

      if (dir == startDir + 8) {
        this.dir = this.CANTMOVE;
        this.newDir = (Random.getRandom16() & 7) + 1;
      }
    } else {
      frame = this.frame;

      if (frame === this.newDir) {
        this.x += this.xDelta[frame];
        this.y += this.yDelta[frame];
        this.worldX = this.x >> 4;
        this.worldY = this.y >> 4;
      }
    }
    if (this.base.spriteNotInBounds(this.worldX, this.worldY)) {
      this.frame = 0;
      return;
    }
    // If we didn't find a new direction, we might explode
    // depending on the last tile we looked at.

    for (let i = 0; i < 8; i++) {
      if (tile === this.tileWhiteList[i]) {
        break;
      }
      //   console.log(i, "aki se for 7?");
      if (i === 7) {
        this.explodeSprite();
        spriteUtilsController.destroyMapTile(this.spriteManager, this.map, blockMaps, this.x, this.y);
      }
    }
  },
  addEventListener(message: string, subject: Function) {},
  spriteNotInBounds(x: number, y: number) {
    return x < 0 || y < 0 || x >= this.map.width || y >= this.map.height;
  },
  explodeSprite() {
    this.frame = 0;
    this.spriteManager.makeExplosionAt(this.x, this.y);
    this.base._emitEvent(SHIP_CRASHED, {
      showable: true,
      x: this.worldX,
      y: this.worldY,
    });
  },
};