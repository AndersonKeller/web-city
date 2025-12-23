import type { iBaseSprite } from "./baseSprite-ts.ts";
import type { GameMap } from "../map/gameMap-ts.ts";
import type { BlockMapSimulation } from "../simulation/simulation-ts.ts";
import type { iSpriteManager } from "./spriteManager-ts.ts";
import { ANIMBIT, BULLBIT } from "../tiles/tileFlags.ts";
import * as TileValues from "../tiles/tileValues.ts";
import { zoneUtilsController } from "../utils/zoneUtils-ts.ts";
export const spriteUtilsController = {
  directionTable: [0, 3, 2, 1, 3, 4, 5, 7, 6, 5, 7, 8, 1],
  pixToWorld(p: number) {
    return p >> 4;
  },
  worldToPix(w: number) {
    return w << 4;
  },
  // Attempt to move 45° towards the desired direction, either
  // clockwise or anticlockwise, whichever gets us there quicker
  turnTo(presentDir: number, desireDir: number): number {
    if (presentDir === desireDir) {
      return presentDir;
    }
    if (presentDir < desireDir) {
      if (desireDir - presentDir < 4) {
        presentDir++;
      } else {
        presentDir--;
      }
    } else {
      if (presentDir - desireDir < 4) {
        presentDir--;
      } else {
        presentDir++;
      }
    }
    if (presentDir > 8) {
      presentDir = 1;
    }
    if (presentDir < 1) {
      presentDir = 8;
    }
    return presentDir;
  },
  getTileValue(map: GameMap, x: number, y: number) {
    var wX = this.pixToWorld(x);
    var wY = this.pixToWorld(y);

    if (wX < 0 || wX >= map.width || wY < 0 || wY >= map.height) {
      return -1;
    }

    return map.getTileValue(wX, wY);
  },
  getDir(orgX: number, orgY: number, destX: number, destY: number): number {
    let deltaX = destX - orgX;
    let deltaY = destY - orgY;
    let i: number;

    if (deltaX < 0) {
      if (deltaY < 0) {
        i = 11;
      } else {
        i = 8;
      }
    } else {
      if (deltaY < 0) {
        i = 2;
      } else {
        i = 5;
      }
    }

    deltaX = Math.abs(deltaX);
    deltaY = Math.abs(deltaY);

    if (deltaX * 2 < deltaY) i++;
    else if (deltaY * 2 < deltaX) i--;

    if (i < 0 || i > 12) i = 0;

    return this.directionTable[i];
  },
  absoluteDistance(orgX: number, orgY: number, destX: number, destY: number) {
    const deltaX = destX - orgX;
    const deltaY = destY - orgY;
    return Math.abs(deltaX) + Math.abs(deltaY);
  },
  checkWet(tileValue: number) {
    if (
      tileValue === TileValues.HPOWER ||
      tileValue === TileValues.VPOWER ||
      tileValue === TileValues.HRAIL ||
      tileValue === TileValues.VRAIL ||
      tileValue === TileValues.BRWH ||
      tileValue === TileValues.BRWV
    )
      return true;
    else return false;
  },
  destroyMapTile(spriteManager: iSpriteManager, map: GameMap, blockMaps: BlockMapSimulation, ox: number, oy: number) {
    const x = this.pixToWorld(ox);
    const y = this.pixToWorld(oy);
    if (!map.testBounds(x, y)) {
      return;
    }
    const tile = map.getTile(x, y);
    const tileValue = tile.getValue();
    if (tileValue < TileValues.TREEBASE) {
      return;
    }
    if (!tile.isCombustible()) {
      if (tileValue >= TileValues.ROADBASE && tileValue <= TileValues.LASTROAD) {
        map.setTile(x, y, TileValues.RIVER, 0);
      }
      return;
    }
    if (tile.isZone()) {
      zoneUtilsController.fireZone(map, x, y, blockMaps);
      if (tileValue > TileValues.RZB) {
        spriteManager.makeExplosion(ox, oy);
      }
    }
    if (this.checkWet(tileValue)) {
      map.setTile(x, y, TileValues.RIVER, 0);
    } else {
      map.setTile(x, y, TileValues.TINYEXP, BULLBIT | ANIMBIT);
    }
  },
  getDistance(x1: number, y1: number, x2: number, y2: number) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  },
  checkSpriteCollision(s1: iBaseSprite, s2: iBaseSprite) {
    return s1.frame !== 0 && s2.frame !== 0 && this.getDistance(s1.x, s1.y, s2.x, s2.y) < 30;
  },
};