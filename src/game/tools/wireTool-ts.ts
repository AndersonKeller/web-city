import { baseToolController, type iBaseToolController } from "./baseTool-ts.ts";
import { connectingToolController } from "./connectionTool-ts.ts";
import type { GameMap } from "../map/gameMap-ts.ts";

import { BULLBIT, BURNBIT, CONDBIT } from "../tiles/tileFlags.ts";
import { tileUtilsController, type iTileUtils } from "../tiles/tileUtils-ts.ts";
// import { TileUtils } from "./tileUtils.js";
import * as TileValues from "../tiles/tileValues.ts";

export const wireToolController = {
  baseTool: null as iBaseToolController,
  tileUtils: null as iTileUtils,
  connection: null,
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
    const res = baseToolController.init(5, map, true, true);
    const con = connectingToolController.create({ prototype: undefined });
    this.baseTool = { ...con.prototype, ...res, ...res.baseToolConstructor };
    this.toolCost = this.baseTool.toolCost;
    this.addCost = this.baseTool.addCost;
    return { ...this, ...this.baseTool };
  },
  layWire(x: number, y: number) {
    this.baseTool.doAutoBulldoze(x, y);
    let cost = this.toolCost.value;
    let tile = this.baseTool._worldEffects.getTileValue(x, y);
    tile = this.tileUtils.normalizeRoad(tile);
    switch (tile) {
      case TileValues.DIRT:
        this.baseTool._worldEffects.setTile(x, y, TileValues.LHPOWER, CONDBIT | BURNBIT | BULLBIT);
        break;
      case TileValues.RIVER:
      case TileValues.REDGE:
      case TileValues.CHANNEL:
        cost = 25;
        if (x < this.baseTool._map.width - 1) {
          const tileBase = this.baseTool._worldEffects.getTile(x + 1, y);
          if (tileBase.isConductive()) {
            tile = tileBase.getValue();
            tile = this.tileUtils.normalizeRoad(tile);
            if (tile != TileValues.HROADPOWER && tile != TileValues.RAILHPOWERV && tile != TileValues.HPOWER) {
              this.baseTool._worldEffects.setTile(x, y, TileValues.VPOWER, CONDBIT | BULLBIT);
              break;
            }
          }
        }
        if (x > 0) {
          const tileBase = this.baseTool._worldEffects.getTile(x - 1, y);
          if (tileBase.isConductive()) {
            tile = tileBase.getValue();
            tile = this.tileUtils.normalizeRoad(tile);
            if (tile != TileValues.HROADPOWER && tile != TileValues.RAILHPOWERV && tile != TileValues.HPOWER) {
              this.baseTool._worldEffects.setTile(x, y, TileValues.VPOWER, CONDBIT | BULLBIT);
              break;
            }
          }
        }
        if (y < this.baseTool._map.height - 1) {
          const tileBase = this.baseTool._worldEffects.getTile(x, y + 1);
          if (tileBase.isConductive()) {
            tile = tileBase.getValue();
            tile = this.tileUtils.normalizeRoad(tile);
            if (tile != TileValues.VROADPOWER && tile != TileValues.RAILVPOWERH && tile != TileValues.VPOWER) {
              this.baseTool._worldEffects.setTile(x, y, TileValues.HPOWER, CONDBIT | BULLBIT);
              break;
            }
          }
        }

        if (y > 0) {
          const tileBase = this.baseTool._worldEffects.getTile(x, y - 1);
          if (tileBase.isConductive()) {
            tile = tileBase.getValue();
            tile = this.tileUtils.normalizeRoad(tile);
            if (tile != TileValues.VROADPOWER && tile != TileValues.RAILVPOWERH && tile != TileValues.VPOWER) {
              this.baseTool._worldEffects.setTile(x, y, TileValues.HPOWER, CONDBIT | BULLBIT);
              break;
            }
          }
        }

        return this.baseTool.TOOLRESULT_FAILED;
      case TileValues.ROADS:
        this.baseTool._worldEffects.setTile(x, y, TileValues.HROADPOWER, CONDBIT | BURNBIT | BULLBIT);
        break;
      case TileValues.ROADS2:
        this.baseTool._worldEffects.setTile(x, y, TileValues.VROADPOWER, CONDBIT | BURNBIT | BULLBIT);
        break;
      case TileValues.LHRAIL:
        this.baseTool._worldEffects.setTile(x, y, TileValues.RAILHPOWERV, CONDBIT | BURNBIT | BULLBIT);
        break;

      case TileValues.LVRAIL:
        this.baseTool._worldEffects.setTile(x, y, TileValues.RAILVPOWERH, CONDBIT | BURNBIT | BULLBIT);
        break;

      default:
        return this.baseTool.TOOLRESULT_FAILED;
    }
    this.addCost(Number(cost));
    this.baseTool.checkZoneConnections(x, y);
    return this.baseTool.TOOLRESULT_OK;
  },
  doTool(x: number, y: number) {
    this.result = this.layWire(x, y);
  },
};
