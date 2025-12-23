import { baseToolController, type iBaseToolController } from "./baseTool-ts";

import * as TileValues from "../tiles/tileValues.ts";
import { gameMapController, type GameMap } from "../map/gameMap-ts.ts";
import { ANIMBIT, BULLBIT } from "../tiles/tileFlags.ts";
import { type iTileUtils, tileUtilsController } from "../tiles/tileUtils-ts.ts";
import { EventEmitter } from "../utils/eventEmitter-ts.ts";
import { SOUND_EXPLOSIONHIGH, SOUND_EXPLOSIONLOW } from "../utils/messages.ts";
import { Random } from "../utils/random.ts";
import { zoneUtilsController } from "../utils/zoneUtils-ts.ts";
import { connectingToolController } from "./connectionTool-ts.ts";

export const bulldozerToolConstroller = {
  tileUtils: null as iTileUtils,
  baseTool: null as iBaseToolController,
  result: null,
  addCost: null as Function,
  toolCost: {} as {
    configurable: boolean;
    enumerable: boolean;
    writeable: boolean;
    value: string | number;
  },
  init(map: GameMap) {
    this.tileUtils = tileUtilsController;
    const res = baseToolController.init(10, map, true);
    const con = connectingToolController.create({ prototype: undefined });
    EventEmitter(con);
    this.baseTool = { ...con.prototype, ...res, ...res.baseToolConstructor };
    this.toolCost = this.baseTool.toolCost;
    this.addCost = this.baseTool.addCost;

    return { ...this, ...this.baseTool };
  },
  putRubble(x: number, y: number, size: number) {
    for (let xx = x; xx < x + size; xx++) {
      for (let yy = y; yy < y + size; yy++) {
        if (gameMapController.testBounds(xx, yy)) {
          const tile = this.baseTool._worldEffects.getTileValue(xx, yy);
          if (tile != TileValues.RADTILE && tile != TileValues.DIRT)
            this.baseTool._worldEffects.setTile(xx, yy, TileValues.TINYEXP + Random.getRandom(2), ANIMBIT | BULLBIT);
        }
      }
    }
  },
  layDoze(x: number, y: number) {
    let tile = this.baseTool._worldEffects.getTile(x, y);

    if (!tile.isBulldozable()) return this.baseTool.TOOLRESULT_FAILED;
    let tileValue = tile.getValue();

    tileValue = this.tileUtils.normalizeRoad(tile.getValue());

    switch (tileValue) {
      case TileValues.HBRIDGE:
      case TileValues.VBRIDGE:
      case TileValues.BRWV:
      case TileValues.BRWH:
      case TileValues.HBRDG0:
      case TileValues.HBRDG1:
      case TileValues.HBRDG2:
      case TileValues.HBRDG3:
      case TileValues.VBRDG0:
      case TileValues.VBRDG1:
      case TileValues.VBRDG2:
      case TileValues.VBRDG3:
      case TileValues.HPOWER:
      case TileValues.VPOWER:
      case TileValues.HRAIL:
      case TileValues.VRAIL:
        this.baseTool._worldEffects.setTile(x, y, TileValues.RIVER);
        break;

      default:
        this.baseTool._worldEffects.setTile(x, y, TileValues.DIRT);
        break;
    }

    this.addCost(1);

    return this.baseTool.TOOLRESULT_OK;
  },
  doTool(x: number, y: number) {
    console.log(this.baseTool, "basetool?");
    if (!gameMapController.testBounds(x, y)) this.result = this.baseTool.TOOLRESULT_FAILED;

    let tile = this.baseTool._worldEffects.getTile(x, y);
    const tileValue = tile.getValue();

    let zoneSize = 0;
    let deltaX;
    let deltaY;

    if (tile.isZone()) {
      zoneSize = zoneUtilsController.checkZoneSize(tileValue);
      deltaX = 0;
      deltaY = 0;
    } else {
      const result = zoneUtilsController.checkBigZone(tileValue);
      zoneSize = result.zoneSize;
      deltaX = result.deltaX;
      deltaY = result.deltaY;
    }

    if (zoneSize > 0) {
      this.addCost(this.baseTool.baseToolConstructor.bulldozerCost);

      const centerX = x + deltaX;
      const centerY = y + deltaY;

      switch (zoneSize) {
        case 3:
          this._emitEvent(SOUND_EXPLOSIONHIGH);
          this.putRubble(centerX - 1, centerY - 1, 3);
          break;

        case 4:
          this._emitEvent(SOUND_EXPLOSIONLOW);
          this.putRubble(centerX - 1, centerY - 1, 4);
          break;

        case 6:
          this._emitEvent(SOUND_EXPLOSIONHIGH);
          this._emitEvent(SOUND_EXPLOSIONLOW);
          this.putRubble(centerX - 1, centerY - 1, 6);
          break;
      }

      this.result = this.baseTool.TOOLRESULT_OK;
    } else {
      let toolResult;
      if (tileValue === TileValues.RIVER || tileValue === TileValues.REDGE || tileValue === TileValues.CHANNEL) {
        toolResult = this.layDoze(x, y);

        if (tileValue !== this.baseTool._worldEffects.getTileValue(x, y)) this.addCost(5);
      } else {
        toolResult = this.layDoze(x, y);
        this.baseTool.checkZoneConnections(x, y);
      }

      this.result = toolResult;
    }
  },
  _emitEvent(_event: string, _subject?: Object) {
    //EVENT EMMITER
    return;
  },
};