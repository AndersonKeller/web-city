import { baseToolController, type iBaseToolController } from "./baseTool-ts";
import { connectingToolController } from "./connectionTool-ts.ts";
import type { GameMap } from "../map/gameMap-ts.ts";
import { BULLBIT, BURNBIT, CONDBIT } from "../tiles/tileFlags.ts";
import { tileUtilsController, type iTileUtils } from "../tiles/tileUtils-ts.ts";
// import { TileUtils } from "./tileUtils";
import * as TileValues from "../tiles/tileValues.ts";
export const roadToolController = {
  baseTool: null as iBaseToolController,
  result: null,
  tileUtils: null as iTileUtils,
  addCost: null as Function,
  toolCost: {} as {
    configurable: boolean;
    enumerable: boolean;
    writeable: boolean;
    value: string | number;
  },
  init(map: GameMap) {
    this.tileUtils = tileUtilsController;
    const res = baseToolController.init(10, map, true, true);
    const con = connectingToolController.create({ prototype: undefined });
    this.baseTool = { ...con.prototype, ...res, ...res.baseToolConstructor };
    this.toolCost = this.baseTool.toolCost;
    this.addCost = this.baseTool.addCost;
    return { ...this, ...this.baseTool };
  },
  layRoad(x: number, y: number) {
    this.baseTool.doAutoBulldoze(x, y);
    let tile = this.baseTool._worldEffects.getTileValue(x, y);
    let cost = this.toolCost.value;

    switch (tile) {
      case TileValues.DIRT:
        this.baseTool._worldEffects.setTile(x, y, TileValues.ROADS, BULLBIT | BURNBIT);
        break;

      case TileValues.RIVER:
      case TileValues.REDGE:
      case TileValues.CHANNEL:
        cost = 50;

        if (x < this.baseTool._map.width - 1) {
          tile = this.baseTool._worldEffects.getTileValue(x + 1, y);
          tile = tileUtilsController.normalizeRoad(tile);

          if (tile === TileValues.VRAILROAD || tile === TileValues.HBRIDGE || (tile >= TileValues.ROADS && tile <= TileValues.HROADPOWER)) {
            this.baseTool._worldEffects.setTile(x, y, TileValues.HBRIDGE, BULLBIT);
            break;
          }
        }

        if (x > 0) {
          tile = this.baseTool._worldEffects.getTileValue(x - 1, y);
          tile = tileUtilsController.normalizeRoad(tile);

          if (tile === TileValues.VRAILROAD || tile === TileValues.HBRIDGE || (tile >= TileValues.ROADS && tile <= TileValues.INTERSECTION)) {
            this.baseTool._worldEffects.setTile(x, y, TileValues.HBRIDGE, BULLBIT);
            break;
          }
        }

        if (y < this.baseTool._map.height - 1) {
          tile = this.baseTool._worldEffects.getTileValue(x, y + 1);
          tile = tileUtilsController.normalizeRoad(tile);

          if (tile === TileValues.HRAILROAD || tile === TileValues.VROADPOWER || (tile >= TileValues.VBRIDGE && tile <= TileValues.INTERSECTION)) {
            this.baseTool._worldEffects.setTile(x, y, TileValues.VBRIDGE, BULLBIT);
            break;
          }
        }

        if (y > 0) {
          tile = this.baseTool._worldEffects.getTileValue(x, y - 1);
          tile = tileUtilsController.normalizeRoad(tile);

          if (tile === TileValues.HRAILROAD || tile === TileValues.VROADPOWER || (tile >= TileValues.VBRIDGE && tile <= TileValues.INTERSECTION)) {
            this.baseTool._worldEffects.setTile(x, y, TileValues.VBRIDGE, BULLBIT);
            break;
          }
        }

        return this.baseTool.TOOLRESULT_FAILED;

      case TileValues.LHPOWER:
        this.baseTool._worldEffects.setTile(x, y, TileValues.VROADPOWER, CONDBIT | BURNBIT | BULLBIT);
        break;

      case TileValues.LVPOWER:
        this.baseTool._worldEffects.setTile(x, y, TileValues.HROADPOWER, CONDBIT | BURNBIT | BULLBIT);
        break;

      case TileValues.LHRAIL:
        this.baseTool._worldEffects.setTile(x, y, TileValues.HRAILROAD, BURNBIT | BULLBIT);
        break;

      case TileValues.LVRAIL:
        this.baseTool._worldEffects.setTile(x, y, TileValues.VRAILROAD, BURNBIT | BULLBIT);
        break;

      default:
        return this.baseTool.TOOLRESULT_FAILED;
    }

    this.addCost(Number(cost));
    this.baseTool.checkZoneConnections(x, y);
    return this.baseTool.TOOLRESULT_OK;
  },
  doTool(x: number, y: number) {
    this.result = this.layRoad(x, y);
  },
};