import { baseToolController, type iBaseToolController } from "./baseTool-ts";
import { connectingToolController } from "./connectionTool-ts.ts";
import { EventEmitter } from "../utils/eventEmitter-ts.ts";
import { gameMapController, type GameMap } from "../map/gameMap-ts.ts";
import * as TileValues from "../tiles/tileValues.ts";
import { textUtils } from "../utils/text-ts.ts";
import type { BlockMapSimulation } from "../simulation/simulation-ts.ts";

import { QUERY_WINDOW_NEEDED } from "../utils/messages.ts";
export const queryToolController = {
  baseTool: null as iBaseToolController,
  addEventListener: (_event: string, _listener: Function) => {},
  result: null,
  baseTiles: [
    TileValues.DIRT,
    TileValues.RIVER,
    TileValues.TREEBASE,
    TileValues.RUBBLE,
    TileValues.FLOOD,
    TileValues.RADTILE,
    TileValues.FIRE,
    TileValues.ROADBASE,
    TileValues.POWERBASE,
    TileValues.RAILBASE,
    TileValues.RESBASE,
    TileValues.COMBASE,
    TileValues.INDBASE,
    TileValues.PORTBASE,
    TileValues.AIRPORTBASE,
    TileValues.COALBASE,
    TileValues.FIRESTBASE,
    TileValues.POLICESTBASE,
    TileValues.STADIUMBASE,
    TileValues.NUCLEARBASE,
    TileValues.HBRDG0,
    TileValues.RADAR0,
    TileValues.FOUNTAIN,
    TileValues.INDBASE2,
    TileValues.FOOTBALLGAME1,
    TileValues.VBRDG0,
    952,
  ],
  addCost: null as Function,
  toolCost: {} as {
    configurable: boolean;
    enumerable: boolean;
    writeable: boolean;
    value: string | number;
  },
  queryZoneType: "",
  queryDensity: "",
  queryLandValue: "",
  queryCrime: "",
  queryPollution: "",
  queryRate: "",
  debug: {
    queryTile: "",
    queryTileValue: "",
    queryFireStationRaw: "",
    queryFireStationEffectRaw: "",
    queryTerrainDensityRaw: "",
    queryPoliceStationRaw: "",
    queryPoliceStationEffectRaw: "",
    queryComRateRaw: "",
    queryRateRaw: "",
    queryPollutionRaw: "",
    queryCrimeRaw: "",
    queryLandValueRaw: "",
    queryTrafficDensityRaw: "",
    queryDensityRaw: "",
  },
  flags: {
    queryTileBurnable: "",
    queryTileBulldozable: "",
    queryTileCond: "",
    queryTileAnim: "",
    queryTilePowered: "",
    queryTileZone: "",
  },
  init(map: GameMap) {
    const res = baseToolController.init(0, map, false, false);
    const con = connectingToolController.create({ prototype: undefined });

    EventEmitter(con);
    this.baseTool = { ...con, ...con.prototype, ...res, ...res.baseToolConstructor };
    this.toolCost = this.baseTool.toolCost;
    this.addCost = this.baseTool.addCost;

    return { ...this, ...this.baseTool };
  },
  classifyPopulationDensity(x: number, y: number, blockMaps: BlockMapSimulation) {
    let density = blockMaps.populationDensityMap.worldGet(x, y);
    this.debug.queryDensityRaw = String(density);
    density = density >> 6;
    density = density & 3;
    this.queryDensity = textUtils.densityStrings[density];
  },
  classifyLandValue(x: number, y: number, blockMaps: BlockMapSimulation) {
    const landValue = blockMaps.landValueMap.worldGet(x, y);

    this.debug.queryLandValueRaw = String(landValue);
    let i = 0;
    if (landValue >= 150) i = 3;
    else if (landValue >= 80) i = 2;
    else if (landValue >= 30) i = 1;

    const text = textUtils.landValueStrings[i];
    this.queryLandValue = text;
  },
  classifyCrime(x: number, y: number, blockMaps: BlockMapSimulation) {
    let crime = blockMaps.crimeRateMap.worldGet(x, y);

    this.debug.queryCrimeRaw = String(crime);
    crime = crime >> 6;
    crime = crime & 3;
    this.queryCrime = textUtils.crimeStrings[crime];
  },
  classifyPollution(x: number, y: number, blockMaps: BlockMapSimulation) {
    let pollution = blockMaps.pollutionDensityMap.worldGet(x, y);

    this.debug.queryPollutionRaw = String(pollution);
    pollution = pollution >> 6;
    pollution = pollution & 3;
    this.queryPollution = textUtils.pollutionStrings[pollution];
  },
  classifyRateOfGrowth(x: number, y: number, blockMaps: BlockMapSimulation) {
    let rate = blockMaps.rateOfGrowthMap.worldGet(x, y);

    this.debug.queryRateRaw = String(rate);
    rate = rate >> 6;
    rate = rate & 3;
    this.queryRate = textUtils.rateStrings[rate];
  },
  classifyDebug(x: number, y: number, blockMaps: BlockMapSimulation) {
    this.debug.queryFireStationRaw = String(blockMaps.fireStationMap.worldGet(x, y));
    this.debug.queryFireStationEffectRaw = String(blockMaps.fireStationEffectMap.worldGet(x, y));
    this.debug.queryPoliceStationRaw = String(blockMaps.policeStationMap.worldGet(x, y));
    this.debug.queryPoliceStationEffectRaw = String(blockMaps.policeStationEffectMap.worldGet(x, y));
    this.debug.queryTerrainDensityRaw = String(blockMaps.terrainDensityMap.worldGet(x, y));
    this.debug.queryTrafficDensityRaw = String(blockMaps.trafficDensityMap.worldGet(x, y));
    this.debug.queryComRateRaw = String(blockMaps.cityCentreDistScoreMap.worldGet(x, y));
  },
  classifyZone(x: number, y: number) {
    let tileValue = gameMapController.getTileValue(x, y);
    if (tileValue >= TileValues.COALSMOKE1 && tileValue < TileValues.FOOTBALLGAME1) {
      tileValue = TileValues.COALBASE;
    }

    let index, l;
    for (index = 0, l = this.baseTiles.length - 1; index < l; index++) {
      if (tileValue < this.baseTiles[index + 1]) break;
    }
    this.queryZoneType = textUtils.zoneTypes[index];
  },
  doTool(x: number, y: number, blockMaps: BlockMapSimulation) {
    let text = "Position (" + x + ", " + y + ")";
    text += " TileValue: " + gameMapController.getTileValue(x, y);

    const tile = gameMapController.getTile(x, y);
    this.debug.queryTile = [x, y].join(",");
    this.debug.queryTileValue = String(tile.getValue());
    this.flags.queryTileBurnable = tile.isCombustible() ? "\u2714" : "\u2718";
    this.flags.queryTileBulldozable = tile.isBulldozable() ? "\u2714" : "\u2718";
    this.flags.queryTileCond = tile.isConductive() ? "\u2714" : "\u2718";
    this.flags.queryTileAnim = tile.isAnimated() ? "\u2714" : "\u2718";
    this.flags.queryTilePowered = tile.isPowered() ? "\u2714" : "\u2718";
    this.flags.queryTileZone = tile.isZone() ? "\u2714" : "\u2718";

    this.classifyZone(x, y);
    this.classifyPopulationDensity(x, y, blockMaps);
    this.classifyLandValue(x, y, blockMaps);
    this.classifyCrime(x, y, blockMaps);
    this.classifyPollution(x, y, blockMaps);
    this.classifyRateOfGrowth(x, y, blockMaps);
    this.classifyDebug(x, y, blockMaps);

    this._emitEvent(QUERY_WINDOW_NEEDED);

    this.result = this.baseTool.TOOLRESULT_OK;
  },
  _emitEvent(_event: string, _subject?: Object) {
    //TODO EVENTEMITTER
    return;
  },
};