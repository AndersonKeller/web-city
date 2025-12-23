import type { GameMap } from "../map/gameMap-ts";
import type { iBudget } from "../simulation/budget-ts";
import { worldEffectsController, type iWorldEffects } from "../simulation/worldEffects-ts";
import type { Tile } from "../tiles/tile";
import { type iTileUtils, tileUtilsController } from "../tiles/tileUtils-ts";
import { TINYEXP, LASTTINYEXP, HBRIDGE, DIRT } from "../tiles/tileValues";
import { miscUtilsController } from "../utils/miscUtils-ts";

export type iBaseToolController = typeof baseToolController;
export const baseToolController = {
  prototype: {} as any,

  checkZoneConnections: null as Function,
  toolCost: null as {
    configurable: boolean;
    enumerable: boolean;
    writeable: boolean;
    value: string | number;
  },
  result: null,
  isDraggable: false,
  _shouldAutoBulldoze: false,
  _map: null as GameMap,
  _worldEffects: null as iWorldEffects,
  _applicationCost: 0,
  TOOLRESULT_OK: 0,
  TOOLRESULT_FAILED: 1,
  TOOLRESULT_NO_MONEY: 2,
  TOOLRESULT_NEEDS_BULLDOZE: 3,
  autoBulldoze: false,
  tileUtils: null as iTileUtils,
  baseToolConstructor: {
    addCost: null as Function,
    autoBulldoze: true,
    bulldozerCost: 1,
    clear: null as Function,
    doAutoBulldoze: null as Function,
    init: null as Function,
    modifyIfEnoughFunding: null as Function,
    TOOLRESULT_OK: 0,
    TOOLRESULT_FAILED: 1,
    TOOLRESULT_NO_MONEY: 2,
    TOOLRESULT_NEEDS_BULLDOZE: 3,
  },
  init(cost: number | string, map: GameMap, shouldAutoBulldoze: boolean, isDraggable?: boolean) {
    isDraggable = isDraggable || false;
    this.tileUtils = tileUtilsController;
    this.toolCost = miscUtilsController.makeConstantDescriptor(cost);
    this.isDraggable = isDraggable;
    this._shouldAutoBulldoze = shouldAutoBulldoze;
    this._map = map;

    this._worldEffects = worldEffectsController.create(this._map);
    this.baseToolConstructor = {
      addCost: this.addCost,
      autoBulldoze: true,
      bulldozerCost: 1,
      clear: this.clear,
      doAutoBulldoze: this.doAutoBulldoze,
      init: this.init,
      modifyIfEnoughFunding: this.modifyIfEnoughFunding,
      TOOLRESULT_OK: this.TOOLRESULT_OK,
      TOOLRESULT_FAILED: this.TOOLRESULT_FAILED,
      TOOLRESULT_NO_MONEY: this.TOOLRESULT_NO_MONEY,
      TOOLRESULT_NEEDS_BULLDOZE: this.TOOLRESULT_NEEDS_BULLDOZE,
    };
    return this;
  },
  clear() {
    this._applicationCost = 0;
    this._worldEffects.clear();
  },
  addCost(cost: any) {
    this._applicationCost += cost;
  },
  doAutoBulldoze(x: number, y: number) {
    let tile: Tile = this._worldEffects.getTile(x, y);
    if (tile.isBulldozable()) {
      const tileValue = this.tileUtils.normalizeRoad(tile.getValue());
      if ((tileValue >= TINYEXP && tileValue <= LASTTINYEXP) || (tileValue < HBRIDGE && tileValue !== DIRT)) {
        this.addCost(1);
        this._worldEffects.setTile(x, y, DIRT);
      }
    }
  },
  apply(budget: iBudget) {
    this._worldEffects.apply();
    budget.spend(this._applicationCost);
    this.clear();
  },
  modifyIfEnoughFunding(budget: iBudget) {
    if (this.result !== this.TOOLRESULT_OK) {
      this.clear();
      return;
    }
    if (budget.totalFunds < this._applicationCost) {
      this.result = this.TOOLRESULT_NO_MONEY;
      this.clear();
      return;
    }
    this.apply.call(this, budget);
    this.clear();
    return true;
  },
  save(saveData) {
    saveData.autoBulldoze = this.baseToolConstructor.autoBulldoze;
  },
  load(saveData) {
    this.autoBulldoze = saveData.autoBulldoze;
  },
  makeTool(toolConstructor) {
    toolConstructor.prototype = this.baseToolConstructor;

    return toolConstructor;
  },
  setAutoBulldoze(value: boolean) {
    this.baseToolConstructor.autoBulldoze = value;
  },
  getAutoBulldoze() {
    return this.baseToolConstructor.autoBulldoze;
  },
};