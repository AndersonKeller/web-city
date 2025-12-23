import { baseSpriteController } from "./baseSprite-ts";
import type { iDisasterManager } from "../manager/disasterManager-ts";
import type { GameMap } from "../map/gameMap-ts";
import { EXPLOSION_REPORTED, SOUND_EXPLOSIONHIGH } from "../utils/messages";
import { miscUtilsController } from "../utils/miscUtils-ts";
import type { BlockMapSimulation } from "../simulation/simulation-ts";
import { SPRITE_EXPLOSION } from "../utils/spriteConstants";
import type { iSpriteManager } from "./spriteManager-ts";
import { tileUtilsController, type iTileUtils } from "../tiles/tileUtils-ts";
// import { TileUtils } from "./tileUtils";
import { DIRT } from "../tiles/tileValues";

export const explosionController = {
  tileUtils: null as iTileUtils,
  width: 48,
  height: 48,
  xOffset: -24,
  yOffset: -24,
  ID: miscUtilsController.makeConstantDescriptor(7),

  frames: miscUtilsController.makeConstantDescriptor(6),
  frame: 1,
  map: null as GameMap,
  base: null,
  init(map: GameMap, spriteManager: iSpriteManager, x: number, y: number) {
    this.base = baseSpriteController.init(SPRITE_EXPLOSION, map, spriteManager, x, y);
    this.map = map;
    this.tileUtils = tileUtilsController;
    return { ...this.base, ...this };
  },
  startFire(x: number, y: number) {
    x = this.base.worldX;
    y = this.base.worldY;
    if (!this.map.testBounds(x, y)) {
      return;
    }
    const tile = this.map.getTile(x, y);
    const tileValue = tile.getValue();
    if (!tile.isCombustible() && tileValue !== DIRT) {
      return;
    }
    if (tile.isZone()) {
      return;
    }
    this.map.setTo(x, y, this.tileUtils.randomFire());
  },
  move(spriteCycle: number, disasterManager: iDisasterManager, blockMaps: BlockMapSimulation) {
    if ((spriteCycle & 1) === 0) {
      if (this.frame === 1) {
        const explosionX = this.base.worldX;
        const explosionY = this.base.worldY;
        this.base._emitEvent(SOUND_EXPLOSIONHIGH);
        this.base._emitEvent(EXPLOSION_REPORTED, { x: explosionX, y: explosionY });
      }
      this.frame++;
    }
    if (this.frame > 6) {
      this.frame = 0;
      this.startFire(this.base.x, this.base.y);
      this.startFire(this.base.x - 16, this.base.y - 16);
      this.startFire(this.base.x + 16, this.base.y + 16);
      this.startFire(this.base.x - 16, this.base.y + 16);
      this.startFire(this.base.x + 16, this.base.y + 16);
    }
  },
  addEventListener(message: string, subject: Function) {},
};