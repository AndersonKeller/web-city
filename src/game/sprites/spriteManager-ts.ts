import type { iBaseSprite } from "./baseSprite-ts.ts";
import { EventEmitter } from "../utils/eventEmitter-ts.ts";
import type { GameMap } from "../map/gameMap-ts.ts";
import type { BlockMapSimulation, iSimulation } from "../simulation/simulation-ts.ts";
import { spriteUtilsController } from "./spriteUtils-ts";
import * as SpriteConstants from "../utils/spriteConstants.ts";
import * as Messages from "../utils/messages.ts";

import { miscUtilsController } from "../utils/miscUtils-ts.ts";
import { Random } from "../utils/random.ts";
import type { iCensus } from "../simulation/census-ts.ts";
import { CHANNEL, RIVER } from "../tiles/tileValues.ts";

import { airplaneSpriteController } from "./airplaneSprite-ts.ts";
import { trainSpriteController } from "./trainSprite-ts.ts";
import { boatSpriteController } from "./boatSprite-ts.ts";

import { copterSpriteController } from "./copterSprite-ts.ts";
import { tornadoSpriteController } from "./tornadoSprite-ts.ts";
import { explosionController } from "./explosionSprite-ts.ts";
import { monsterStore } from "../../stores/monster.store.ts";
import { monsterSpriteController } from "./monsterSprite-ts.ts";

import type { iBudget } from "../simulation/budget-ts.ts";
import type { iDisasterManager } from "../manager/disasterManager-ts.ts";
import type { iRepairManager } from "../manager/repairManager-ts.ts";
import type { iPowerManager } from "../manager/powerManager-ts.ts";
import type { iTraffic } from "../simulation/traffic-ts.ts";
import type { iValves } from "../simulation/valves-ts.ts";
import { notificationStore } from "../../stores/notification.store.ts";

export interface iSprite extends iBaseSprite {}
export type iSpriteManager = typeof spriteManagerController;
export const spriteManagerController = {
  _map: null as GameMap,
  spriteList: [] as iSprite[],
  spriteCycle: 0,

  create(map: GameMap) {
    this._map = map;
    EventEmitter(this);
    // this.constructors[SpriteConstants.SPRITE_AIRPLANE] = airplaneSpriteController;
    return this;
  },
  getSprite(type: number) {
    const filteredList = this.spriteList.find((sprite) => {
      return sprite.frame !== 0 && sprite.type === type;
    });

    return filteredList ?? null;
  },
  getSpriteList() {
    return this.spriteList.slice();
  },
  getSpritesInView(startX: number, startY: number, pixelWidth: number, pixelHeight: number) {
    startX = spriteUtilsController.worldToPix(startX);
    startY = spriteUtilsController.worldToPix(startY);
    const lastX = startX + pixelWidth;
    const lastY = startY + pixelHeight;

    return this.spriteList.filter((sprite) => {
      const spriteLeft = sprite.x + sprite.xOffset;
      const spriteTop = sprite.y + sprite.yOffset;
      const spriteRight = sprite.x + sprite.xOffset + sprite.width;
      const spriteBottom = sprite.y + sprite.yOffset + sprite.width;

      const leftInBounds = spriteLeft >= startX && spriteLeft < lastX;
      const rightInBounds = spriteRight >= startX && spriteRight < lastX;
      const topInBounds = spriteTop >= startY && spriteTop < lastY;
      const bottomInBounds = spriteBottom >= startY && spriteBottom < lastY;

      return (leftInBounds || rightInBounds) && (topInBounds || bottomInBounds);
    });
  },
  moveObjects(simData: {
    blockMaps: any;
    budget: any;
    census: any;
    cityTime: number;
    disasterManager: any;
    gameLevel: number;
    repairManager: any;
    powerManager: any;
    simulator: any;
    spriteManager: any;
    trafficManager: any;
    valves: any;
  }) {
    const disasterManager = simData.disasterManager;
    const blockMaps = simData.blockMaps;

    this.spriteCycle += 1;

    const list = this.spriteList.slice();
    for (var i = 0, l = list.length; i < l; i++) {
      var sprite = list[i];

      if (sprite.frame === 0) continue;

      sprite.move(this.spriteCycle, disasterManager, blockMaps);
    }

    this.pruneDeadSprites();
  },
  makeSprite(type: number, x: number, y: number) {
    const bases = {
      [SpriteConstants.SPRITE_MONSTER]: monsterSpriteController,
      [SpriteConstants.SPRITE_SHIP]: boatSpriteController,
      [SpriteConstants.SPRITE_TRAIN]: trainSpriteController,
      [SpriteConstants.SPRITE_HELICOPTER]: copterSpriteController,
      [SpriteConstants.SPRITE_AIRPLANE]: airplaneSpriteController,
      [SpriteConstants.SPRITE_TORNADO]: tornadoSpriteController,
      [SpriteConstants.SPRITE_EXPLOSION]: explosionController,
    };

    const newSprite = bases[type].init(this._map, this, x, y);
    // Listen for crashes

    for (var i = 0; i < Messages.CRASHES.length; i++) {
      newSprite.addEventListener(Messages.CRASHES[i], miscUtilsController.reflectEvent.bind(this, Messages.CRASHES[i]));
    }
    if (type == SpriteConstants.SPRITE_HELICOPTER) {
      newSprite.addEventListener(Messages.HEAVY_TRAFFIC, miscUtilsController.reflectEvent.bind(this, Messages.HEAVY_TRAFFIC));
    }
    this.spriteList.push(newSprite);
    return newSprite;
  },
  makeTornado() {
    let sprite = this.getSprite(SpriteConstants.SPRITE_TORNADO);

    if (sprite !== null) {
      sprite.count = 200;
      this._emitEvent(Messages.TORNADO_SIGHTED, {
        trackable: true,
        x: sprite.worldX,
        y: sprite.worldY,
        sprite,
      });
      return;
    }
    const x = Random.getRandom(spriteUtilsController.worldToPix(this._map.width) - 800) + 400;
    const y = Random.getRandom(spriteUtilsController.worldToPix(this._map.height) - 200) + 100;
    sprite = this.makeSprite(SpriteConstants.SPRITE_TORNADO, x, y);

    this._emitEvent(Messages.TORNADO_SIGHTED, {
      trackable: true,
      x: sprite.worldX,
      y: sprite.worldY,
      sprite,
    });
    notificationStore().setData({ x: sprite.worldX, y: sprite.worldY, sprite });
    notificationStore().setNotification(Messages.TORNADO_SIGHTED, "bad");
  },
  makeExplosion(x: number, y: number) {
    if (this._map.testBounds(x, y)) {
      this.makeExplosionAt(spriteUtilsController.worldToPix(x), spriteUtilsController.worldToPix(y));
    }
  },
  makeExplosionAt(x: number, y: number) {
    this.makeSprite(SpriteConstants.SPRITE_EXPLOSION, x, y);
  },
  generatePlane(x: number, y: number) {
    if (this.getSprite(SpriteConstants.SPRITE_AIRPLANE) !== null) {
      return;
    }
    this.makeSprite(SpriteConstants.SPRITE_AIRPLANE, spriteUtilsController.worldToPix(x), spriteUtilsController.worldToPix(y));
  },
  generateTrain(census: iCensus, x: number, y: number) {
    if (census.totalPop > 10 && this.getSprite(SpriteConstants.SPRITE_TRAIN) === null && Random.getRandom(25) === 0)
      this.makeSprite(SpriteConstants.SPRITE_TRAIN, spriteUtilsController.worldToPix(x) + 8, spriteUtilsController.worldToPix(y) + 8);
  },
  generateShip() {
    // XXX This code is borked. The map generator will never
    // place a channel tile on the edges of the map
    let x, y;

    if (Random.getChance(3)) {
      for (x = 4; x < this._map.width - 2; x++) {
        if (this._map.getTileValue(x, 0) === CHANNEL) {
          this.makeShipHere(x, 0);
          return;
        }
      }
    }

    if (Random.getChance(3)) {
      for (y = 1; y < this._map.height - 2; y++) {
        if (this._map.getTileValue(0, y) === CHANNEL) {
          this.makeShipHere(0, y);
          return;
        }
      }
    }

    if (Random.getChance(3)) {
      for (x = 4; x < this._map.width - 2; x++) {
        if (this._map.getTileValue(x, this._map.height - 1) === CHANNEL) {
          this.makeShipHere(x, this._map.height - 1);
          return;
        }
      }
    }

    if (Random.getChance(3)) {
      for (y = 1; y < this._map.height - 2; y++) {
        if (this._map.getTileValue(this._map.width - 1, y) === CHANNEL) {
          this.makeShipHere(this._map.width - 1, y);
          return;
        }
      }
    }
  },
  getBoatDistance(x: number, y: number): number {
    let dist = 99999;
    const pixelX = spriteUtilsController.worldToPix(x) + 8;
    const pixelY = spriteUtilsController.worldToPix(y) + 8;

    for (let i = 0, l = this.spriteList.length; i < l; i++) {
      const sprite = this.spriteList[i];
      if (sprite.type === SpriteConstants.SPRITE_SHIP && sprite.frame !== 0) {
        const sprDist = Math.abs(sprite.x - pixelX) + Math.abs(sprite.y - pixelY);

        dist = Math.min(dist, sprDist);
      }
    }

    return dist;
  },
  generateCopter(x: number, y: number) {
    if (this.getSprite(SpriteConstants.SPRITE_HELICOPTER) !== null) {
      return;
    }

    this.makeSprite(SpriteConstants.SPRITE_HELICOPTER, spriteUtilsController.worldToPix(x), spriteUtilsController.worldToPix(y));
  },
  makeMonster() {
    const sprite = this.getSprite(SpriteConstants.SPRITE_MONSTER);
    if (sprite !== null) {
      sprite.soundCount = 1;
      sprite.count = 1000;
      sprite.destX = spriteUtilsController.worldToPix(this._map.pollutionMaxX);
      sprite.destY = spriteUtilsController.worldToPix(this._map.pollutionMaxY);
    }

    let done = 0;
    for (let i = 0; i < 300; i++) {
      const x = Random.getRandom(this._map.width - 20) + 10;
      const y = Random.getRandom(this._map.height - 10) + 5;

      const tile = this._map.getTile(x, y);
      if (tile.getValue() === RIVER) {
        this.makeMonsterAt(x, y);
        done = 1;
        break;
      }
    }

    if (done === 0) {
      this.makeMonsterAt(60, 50);
    }
    notificationStore().setNotification(Messages.MONSTER_SIGHTED, "bad");
  },
  makeMonsterAt(x: number, y: number) {
    const sprite = this.makeSprite(SpriteConstants.SPRITE_MONSTER, spriteUtilsController.worldToPix(x), spriteUtilsController.worldToPix(y));
    this._emitEvent(Messages.MONSTER_SIGHTED, {
      trackable: true,
      x: x,
      y: y,
      sprite: sprite,
    });
  },
  makeShipHere(x: number, y: number) {
    this.makeSprite(SpriteConstants.SPRITE_SHIP, spriteUtilsController.worldToPix(x), spriteUtilsController.worldToPix(y));
  },
  pruneDeadSprites() {
    this.spriteList = this.spriteList.filter(function (sprite) {
      return sprite.frame !== 0;
    });
  },
  _emitEvent(event, subject) {
    //TODO EMITEVENTER
    return;
  },
};
