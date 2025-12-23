import { type iBaseToolController, baseToolController } from "./baseTool-ts";
import { connectingToolController } from "./connectionTool-ts.ts";
import type { GameMap } from "../map/gameMap-ts.ts";
import { BULLBIT, BURNBIT, CONDBIT } from "../tiles/tileFlags.ts";
import { tileUtilsController, type iTileUtils } from "../tiles/tileUtils-ts.ts";
// import { TileUtils } from "./tileUtils.js";
import * as TileValues from "../tiles/tileValues.ts";
export const railToolController = {
  baseTool: null as iBaseToolController,
  result: null,
  addCost: null as Function,
  tileUtils: null as iTileUtils,
  toolCost: {} as {
    configurable: boolean;
    enumerable: boolean;
    writeable: boolean;
    value: string | number;
  },
  init(map: GameMap) {
    this.tileUtils = tileUtilsController;
    const res = baseToolController.init(20, map, true, true);
    const con = connectingToolController.create({ prototype: undefined });
    this.baseTool = { ...con.prototype, ...res, ...res.baseToolConstructor };
    this.toolCost = this.baseTool.toolCost;
    this.addCost = this.baseTool.addCost;

    return { ...this, ...this.baseTool };
  },
  layRail(x: number, y: number) {
    this.baseTool.doAutoBulldoze(x, y);
    let tile = this.baseTool._worldEffects.getTileValue(x, y);
    tile = this.tileUtils.normalizeRoad(tile);
    let cost = this.toolCost.value;

    switch (tile) {
      case TileValues.DIRT:
        this.baseTool._worldEffects.setTile(x, y, TileValues.LHRAIL, BULLBIT | BURNBIT);
        break;

      case TileValues.RIVER:
      case TileValues.REDGE:
      case TileValues.CHANNEL:
        cost = 100;

        if (x < this.baseTool._map.width - 1) {
          tile = this.baseTool._worldEffects.getTileValue(x + 1, y);
          tile = this.tileUtils.normalizeRoad(tile);
          if (tile == TileValues.RAILHPOWERV || tile == TileValues.HRAIL || (tile >= TileValues.LHRAIL && tile <= TileValues.HRAILROAD)) {
            this.baseTool._worldEffects.setTile(x, y, TileValues.HRAIL, BULLBIT);
            break;
          }
        }

        if (x > 0) {
          tile = this.baseTool._worldEffects.getTileValue(x - 1, y);
          tile = this.tileUtils.normalizeRoad(tile);
          if (tile == TileValues.RAILHPOWERV || tile == TileValues.HRAIL || (tile > TileValues.VRAIL && tile < TileValues.VRAILROAD)) {
            this.baseTool._worldEffects.setTile(x, y, TileValues.HRAIL, BULLBIT);
            break;
          }
        }

        if (y < this.baseTool._map.height - 1) {
          tile = this.baseTool._worldEffects.getTileValue(x, y + 1);
          tile = this.tileUtils.normalizeRoad(tile);
          if (tile == TileValues.RAILVPOWERH || tile == TileValues.VRAILROAD || (tile > TileValues.HRAIL && tile < TileValues.HRAILROAD)) {
            this.baseTool._worldEffects.setTile(x, y, TileValues.VRAIL, BULLBIT);
            break;
          }
        }

        if (y > 0) {
          tile = this.baseTool._worldEffects.getTileValue(x, y - 1);
          tile = this.tileUtils.normalizeRoad(tile);
          if (tile == TileValues.RAILVPOWERH || tile == TileValues.VRAILROAD || (tile > TileValues.HRAIL && tile < TileValues.HRAILROAD)) {
            this.baseTool._worldEffects.setTile(x, y, TileValues.VRAIL, BULLBIT);
            break;
          }
        }

        return this.baseTool.TOOLRESULT_FAILED;

      case TileValues.LHPOWER:
        this.baseTool._worldEffects.setTile(x, y, TileValues.RAILVPOWERH, CONDBIT | BURNBIT | BULLBIT);
        break;

      case TileValues.LVPOWER:
        this.baseTool._worldEffects.setTile(x, y, TileValues.RAILHPOWERV, CONDBIT | BURNBIT | BULLBIT);
        break;

      case TileValues.ROADS:
        this.baseTool._worldEffects.setTile(x, y, TileValues.VRAILROAD, BURNBIT | BULLBIT);
        break;

      case TileValues.ROADS2:
        this.baseTool._worldEffects.setTile(x, y, TileValues.HRAILROAD, BURNBIT | BULLBIT);
        break;

      default:
        return this.baseTool.TOOLRESULT_FAILED;
    }

    this.addCost(Number(cost));
    this.baseTool.checkZoneConnections(x, y);
    return this.baseTool.TOOLRESULT_OK;
  },
  doTool(x: number, y: number) {
    this.result = this.layRail(x, y);
  },
};