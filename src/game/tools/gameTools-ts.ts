import { buildingToolController } from "./buildingTool-ts";
import { bulldozerToolConstroller } from "./bulldozerTool-ts";
import { EventEmitter } from "../utils/eventEmitter-ts.ts";
import { parkToolController } from "./parkTool-ts.ts";
import { queryToolController } from "./queryTool-ts.ts";
import { railToolController } from "./railTool-ts.ts";
import { roadToolController } from "./roadTool-ts.ts";
import { wireToolController } from "./wireTool-ts.ts";
import * as TileValues from "../tiles/tileValues.ts";
import type { GameMap } from "../map/gameMap-ts.ts";
import { QUERY_WINDOW_NEEDED } from "../utils/messages.ts";
import { miscUtilsController } from "../utils/miscUtils-ts.ts";
export type iGameTools = typeof gameToolsController;
export const gameToolsController = {
  tools: null,
  create(map: GameMap) {
    this.tools = EventEmitter({
      airport: buildingToolController.init(10000, TileValues.AIRPORT, map, 6, false),
      bulldozer: bulldozerToolConstroller.init(map),

      coal: buildingToolController.init(3000, TileValues.POWERPLANT, map, 4, false),

      commercial: buildingToolController.init(100, TileValues.COMCLR, map, 3, false),
      //fire: new BuildingTool(500, TileValues.FIRESTATION, map, 3, false),
      fire: buildingToolController.init(500, TileValues.FIRESTATION, map, 3, false),
      //industrial: new BuildingTool(100, TileValues.INDCLR, map, 3, false),
      industrial: buildingToolController.init(100, TileValues.INDCLR, map, 3, false),

      //nuclear: new BuildingTool(5000, TileValues.NUCLEAR, map, 4, true),
      nuclear: buildingToolController.init(5000, TileValues.NUCLEAR, map, 4, true),
      park: parkToolController.init(map),
      // police: new BuildingTool(500, TileValues.POLICESTATION, map, 3, false),
      police: buildingToolController.init(500, TileValues.POLICESTATION, map, 3, false),

      //port: new BuildingTool(3000, TileValues.PORT, map, 4, false),
      port: buildingToolController.init(3000, TileValues.PORT, map, 4, false),
      rail: railToolController.init(map),
      //residential: new BuildingTool(100, TileValues.FREEZ, map, 3, false),
      residential: buildingToolController.init(100, TileValues.FREEZ, map, 3, false),
      road: roadToolController.init(map),
      query: queryToolController.init(map),
      //stadium: new BuildingTool(5000, TileValues.STADIUM, map, 4, false),
      stadium: buildingToolController.init(5000, TileValues.STADIUM, map, 4, false),
      wire: wireToolController.init(map),
    });
    this.tools.query.addEventListener(QUERY_WINDOW_NEEDED, miscUtilsController.reflectEvent.bind(this.tools, QUERY_WINDOW_NEEDED));
    return this.tools;
  },
};