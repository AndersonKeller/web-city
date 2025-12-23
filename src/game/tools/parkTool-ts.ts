import { type iBaseToolController, baseToolController } from "./baseTool-ts";
import { connectingToolController } from "./connectionTool-ts";
import type { GameMap } from "../map/gameMap-ts";
import { Random } from "../utils/random";
import type { BlockMapSimulation } from "../simulation/simulation-ts";
import { ANIMBIT, BULLBIT, BURNBIT } from "../tiles/tileFlags";
import { DIRT, FOUNTAIN, WOODS2 } from "../tiles/tileValues";

export const parkToolController = {
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
    const res = baseToolController.init(10, map, true);
    const con = connectingToolController.create({ prototype: undefined });
    this.baseTool = { ...con.prototype, ...res, ...res.baseToolConstructor };
    this.toolCost = this.baseTool.toolCost;
    this.addCost = this.baseTool.addCost;

    return { ...this, ...this.baseTool };
  },
  doTool(x: number, y: number, _blockMaps: BlockMapSimulation) {
    if (this.baseTool._worldEffects.getTileValue(x, y) !== DIRT) {
      this.result = this.baseTool.TOOLRESULT_NEEDS_BULLDOZE;
      return;
    }

    var value = Random.getRandom(4);
    var tileFlags = BURNBIT | BULLBIT;
    var tileValue;

    if (value === 4) {
      tileValue = FOUNTAIN;
      tileFlags |= ANIMBIT;
    } else {
      tileValue = value + WOODS2;
    }

    this.baseTool._worldEffects.setTile(x, y, tileValue, tileFlags);
    this.addCost(10);
    this.result = this.baseTool.TOOLRESULT_OK;
  },
};