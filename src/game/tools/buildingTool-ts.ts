import type { GameMap } from "../map/gameMap-ts";
import { BNCNBIT, ZONEBIT, ANIMBIT } from "../tiles/tileFlags";
import { type iTileUtils, tileUtilsController } from "../tiles/tileUtils-ts";
import { DIRT } from "../tiles/tileValues";
import { baseToolController, type iBaseToolController } from "./baseTool-ts";
import { connectingToolController } from "./connectionTool-ts";

export interface iBaseToolConnector extends iBaseToolController {
  checkZoneConnections: Function;
  fixSingle: Function;
  checkBorder: Function;
  fixZone: Function;
}
export const buildingToolController = {
  tileUtils: null as iTileUtils,
  baseTool: null as iBaseToolConnector,
  result: null,
  addCost: null as Function,
  toolCost: {} as {
    configurable: boolean;
    enumerable: boolean;
    writeable: boolean;
    value: string | number;
  },
  centreTile: 0,
  size: 0,
  animated: false,
  init(cost: number, centreTile: number, map: GameMap, size: number, animated: boolean) {
    this.tileUtils = tileUtilsController;
    const res = baseToolController.init(cost, map, false);
    const con = connectingToolController.create({ prototype: undefined });
    this.baseTool = { ...con.prototype, ...con, ...res, ...res.baseToolConstructor };
    this.toolCost = this.baseTool.toolCost;
    this.addCost = this.baseTool.addCost;
    this.centreTile = centreTile;
    this.size = size;

    this.animated = animated;
    return { ...this, ...this.baseTool };
  },
  putBuilding(leftX: number, topY: number) {
    let posX, posY, tileValue, tileFlags;
    let baseTile = this.centreTile - this.size - 1;

    for (let dy = 0; dy < this.size; dy++) {
      posY = topY + dy;

      for (let dx = 0; dx < this.size; dx++) {
        posX = leftX + dx;
        tileValue = baseTile;
        tileFlags = BNCNBIT;

        if (dx === 1) {
          if (dy === 1) tileFlags |= ZONEBIT;
          else if (dy === 2 && this.animated) tileFlags |= ANIMBIT;
        }

        this.baseTool._worldEffects.setTile(posX, posY, tileValue, tileFlags);

        baseTile++;
      }
    }
  },
  prepareBuildingSite(leftX: number, topY: number) {
    // Check that the entire site is on the map
    if (leftX < 0 || leftX + this.size > this.baseTool._map.width) return this.baseTool.TOOLRESULT_FAILED;

    if (topY < 0 || topY + this.size > this.baseTool._map.height) return this.baseTool.TOOLRESULT_FAILED;

    let posX, posY, tileValue;

    // Check whether the tiles are clear
    for (let dy = 0; dy < this.size; dy++) {
      posY = topY + dy;

      for (let dx = 0; dx < this.size; dx++) {
        posX = leftX + dx;

        tileValue = this.baseTool._worldEffects.getTileValue(posX, posY);

        if (tileValue === DIRT) continue;

        if (!this.baseTool.autoBulldoze) {
          // No TileValues.DIRT and no bull-dozer => not buildable
          return this.baseTool.TOOLRESULT_NEEDS_BULLDOZE;
        }

        if (!this.tileUtils.canBulldoze(tileValue)) {
          // tilevalue cannot be auto-bulldozed
          return this.baseTool.TOOLRESULT_NEEDS_BULLDOZE;
        }

        this.baseTool._worldEffects.setTile(posX, posY, DIRT);
        this.addCost(this.baseTool.baseToolConstructor.bulldozerCost);
      }
    }

    return this.baseTool.TOOLRESULT_OK;
  },
  buildBuilding(x: number, y: number) {
    // Correct to top left
    x--;
    y--;

    const prepareResult = this.prepareBuildingSite(x, y);
    if (prepareResult !== this.baseTool.TOOLRESULT_OK) return prepareResult;

    this.addCost(Number(this.toolCost.value));

    this.putBuilding(x, y);

    this.baseTool.checkBorder(x, y);

    return this.baseTool.TOOLRESULT_OK;
  },
  doTool(x: number, y: number) {
    this.result = this.buildBuilding(x, y);
  },
};