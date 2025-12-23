import type { iCensus } from "../simulation/census-ts.ts";
import type { GameMap } from "../map/gameMap-ts.ts";
import { Random } from "../utils/random.ts";

// import { TileUtils } from "./tileUtils";
import * as TileValues from "../tiles/tileValues.ts";
import * as Messages from "../utils/messages.ts";
import type { Tile } from "../tiles/tile.ts";
import { SPRITE_AIRPLANE } from "../utils/spriteConstants.ts";

import { zoneUtilsController } from "../utils/zoneUtils-ts.ts";

import { EventEmitter } from "../utils/eventEmitter-ts.ts";
import type { iSpriteManager } from "../sprites/spriteManager-ts.ts";
import type { BlockMapSimulation } from "../simulation/simulation-ts.ts";
import { tileUtilsController, type iTileUtils } from "../tiles/tileUtils-ts.ts";
import { notificationStore } from "../../stores/notification.store.ts";

export type iDisasterManager = typeof disasterManagerController;

export const disasterManagerController = {
  tileUtils: null as iTileUtils,
  _map: null as GameMap,
  _spriteManager: null as iSpriteManager,
  _gameLevel: 1,
  _floodCount: 0,
  disastersEnabled: false,
  DisChance: [479, 239, 59],
  Dx: [0, 1, 0, -1],
  Dy: [-1, 0, 1, 0],
  create(map: GameMap, spriteManager: iSpriteManager, gameLevel: number) {
    this._map = map;
    this.tileUtils = tileUtilsController;
    this._spriteManager = spriteManager;
    this._gameLevel = gameLevel;
    EventEmitter(this);
    return this;
  },
  doDisasters(census: iCensus) {
    if (this._floodCount) {
      this._floodCount--;
    }
    if (!this.disastersEnabled) {
      return;
    }
    if (!Random.getERandom(this.DisChance[this._gameLevel])) {
      switch (Random.getERandom(8)) {
        case 0:
        case 1:
          this.setFire();
          break;
        case 2:
        case 3:
          this.makeFlood();
          break;

        case 4:
          break;

        case 5:
          this._spriteManager.makeTornado();
          break;

        case 6:
          // TODO Earthquakes
          //this.makeEarthquake();
          break;

        case 7:
        case 8:
          if (census.pollutionAverage > 60) this._spriteManager.makeMonster();
          break;
      }
    }
  },
  makeFire() {
    this.setFire(40, false);
  },
  setFire(times?: number, zonesOnly?: boolean) {
    times = times || 1;
    zonesOnly = zonesOnly || false;
    for (let i = 0; i < times; i++) {
      const x = Random.getRandom(this._map.width - 1);
      const y = Random.getRandom(this._map.height - 1);
      if (!this._map.testBounds(x, y)) {
        continue;
      }
      const tile = this._map.getTile(x, y);

      if (!tile.isZone()) {
        let tileValue = tile.getValue();
        const lowerLimit = zonesOnly ? TileValues.LHTHR : TileValues.TREEBASE;
        if (tileValue > lowerLimit && tileValue < TileValues.LASTZONE) {
          this._map.setTo(x, y, this.tileUtils.randomFire());
          this._emitEvent(Messages.FIRE_REPORTED, { showable: true, x, y });
          notificationStore().setData({ x, y, sprite: this });
          notificationStore().setNotification(Messages.FIRE_REPORTED, "bad");
          return;
        }
      }
    }
  },
  makeFlood() {
    for (let i = 0; i < 300; i++) {
      const x = Random.getRandom(this._map.width - 1);
      const y = Random.getRandom(this._map.height - 1);
      if (!this._map.testBounds(x, y)) {
        continue;
      }
      let tileValue = this._map.getTileValue(x, y);
      if (tileValue > TileValues.CHANNEL && tileValue <= TileValues.WATER_HIGH) {
        for (let j = 0; j < 4; j++) {
          const xx = x + this.Dx[j];
          const yy = y + this.Dy[j];
          if (!this._map.testBounds(xx, yy)) {
            continue;
          }
          const tile = this._map.getTile(xx, yy);
          tileValue = tile.getValue();
          if (tileValue === TileValues.DIRT || (tile.isBulldozable() && tile.isCombustible)) {
            this._map.setTile(xx, yy, TileValues.FLOOD, 0);
            this._floodCount = 30;
            this._emitEvent(Messages.FLOODING_REPORTED, {
              showable: true,
              x: xx,
              y: yy,
            });
          }
        }
      }
    }

    notificationStore().setNotification(Messages.FLOODING_REPORTED, "bad");
  },
  doFlood(x: number, y: number, blockMaps: BlockMapSimulation) {
    if (this._floodCount > 0) {
      for (let i = 0; i < 4; i++) {
        if (Random.getRandom(7)) {
          const xx = x + this.Dx[i];
          const yy = y + this.Dy[i];

          if (this._map.testBounds(xx, yy)) {
            const tile = this._map.getTile(xx, yy);
            const tileValue = tile.getValue();

            if (tile.isCombustible() || tileValue === TileValues.DIRT || (tileValue >= TileValues.WOODS5 && tileValue < TileValues.FLOOD)) {
              if (tile.isZone()) {
                zoneUtilsController.fireZone(this._map, xx, yy, blockMaps);
              }
              this._map.setTile(xx, yy, TileValues.FLOOD + Random.getRandom(2), 0);
            }
          }
        }
      }
    } else {
      if (Random.getChance(15)) {
        this._map.setTile(x, y, TileValues.DIRT, 0);
      }
    }
  },
  scenarioDisaster() {
    //TODO Scenarios
  },
  makeMeltdown() {
    for (let x = 0; x < this._map.width - 1; x++) {
      for (let y = 0; y < this._map.height - 1; y++) {
        if (this._map.getTileValue(x, y) === TileValues.NUCLEAR) {
          this.doMeltdown(x, y);
          notificationStore().setData({ x, y, sprite: this });
          notificationStore().setNotification(Messages.NUCLEAR_MELTDOWN, "bad");
          return;
        }
      }
    }
  },
  doMeltdown(x: number, y: number) {
    this._spriteManager.makeExplosion(x - 1, y - 1);
    this._spriteManager.makeExplosion(x - 1, y + 2);
    this._spriteManager.makeExplosion(x + 2, y - 1);
    this._spriteManager.makeExplosion(x + 2, y + 2);

    let dY, dX;
    // Whole power plant is on fire
    for (dX = x - 1; dX < x + 3; dX++) {
      for (dY = y - 1; dY < y + 3; dY++) {
        this._map.setTo(dX, dY, this.tileUtils.randomFire());
      }
    }

    // Add lots of radiation tiles around the plant
    for (let i = 0; i < 200; i++) {
      dX = x - 20 + Random.getRandom(40);
      dY = y - 15 + Random.getRandom(30);

      if (!this._map.testBounds(dX, dY)) {
        continue;
      }
      const tile = this._map.getTile(dX, dY);
      if (tile.isZone()) {
        continue;
      }
      if (tile.isCombustible() || tile.getValue() === TileValues.DIRT) {
        this._map.setTile(dX, dY, TileValues.RADTILE, 0);
      }
    }
    // Report disaster to the user
    this._emitEvent(Messages.NUCLEAR_MELTDOWN, { showable: true, x, y });
  },
  vulnerable(tile: Tile) {
    const tileValue = tile.getValue();

    if (tileValue < TileValues.RESBASE || tileValue > TileValues.LASTZONE || tile.isZone()) {
      return false;
    }
    return true;
  },
  makeCrash() {
    let sprite: any = this._spriteManager.getSprite(SPRITE_AIRPLANE);

    if (sprite !== null) {
      sprite.explodeSprite;
      return;
    }

    const x = Random.getRandom(this._map.width - 1);
    const y = Random.getRandom(this._map.height - 1);
    this._spriteManager.generatePlane(x, y);
    sprite = this._spriteManager.getSprite(SPRITE_AIRPLANE);

    sprite.explodeSprite();
    notificationStore().setData({ x, y, sprite });
    notificationStore().setNotification(Messages.CRASHES[1], "bad");
  },
  _emitEvent(event: string, subject: Object) {
    //decorator for EventEmitter
    return;
  },
};
