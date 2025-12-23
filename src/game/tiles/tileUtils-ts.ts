import { Random } from "../utils/random.ts";
import { Tile } from "./tile";
import { ANIMBIT, BULLBIT } from "./tileFlags";
import * as TileValues from "./tileValues.ts";
export type iTileUtils = typeof tileUtilsController;

function canBulldoze(tileValue: number) {
  return (
    (tileValue >= TileValues.FIRSTRIVEDGE && tileValue <= TileValues.LASTRUBBLE) ||
    (tileValue >= TileValues.POWERBASE + 2 && tileValue <= TileValues.POWERBASE + 12) ||
    (tileValue >= TileValues.TINYEXP && tileValue <= TileValues.LASTTINYEXP + 2)
  );
}

function isCommercialZone(tile: Tile) {
  const tileValue = tile.getValue();

  return tile.isZone() && isCommercial(tileValue);
}
function isCommercial(tile: number) {
  return tile >= TileValues.COMBASE && tile < TileValues.INDBASE;
}
function isDriveable(tile: number) {
  return (tile >= TileValues.ROADBASE && tile <= TileValues.LASTROAD) || (tile >= TileValues.RAILHPOWERV && tile <= TileValues.LASTRAIL);
}
function isFire(tile: number) {
  return tile >= TileValues.FIREBASE && tile < TileValues.ROADBASE;
}
function isFlood(tile: number) {
  return tile >= TileValues.FLOOD && tile < TileValues.LASTFLOOD;
}
function isIndustrial(tile: number) {
  return tile >= TileValues.INDBASE && tile < TileValues.PORTBASE;
}
function isIndustrialZone(tile: Tile) {
  const tileValue = tile.getValue();

  return tile.isZone() && isIndustrial(tileValue);
}
function isManualExplosion(tile: number) {
  return tile >= TileValues.TINYEXP && tile <= TileValues.LASTTINYEXP;
}
function isRail(tile: Tile) {
  const tileValue = tile.getValue();
  return tileValue >= TileValues.RAILBASE && tileValue < TileValues.RESBASE;
}
function isResidential(tile: number) {
  return tile >= TileValues.RESBASE && tile < TileValues.HOSPITALBASE;
}
function isResidentialZone(tile: Tile) {
  const tileValue = tile.getValue();
  return tile.isZone() && isResidential(tileValue);
}
function isRoad(tile: number) {
  return tile >= TileValues.ROADBASE && tile < TileValues.POWERBASE;
}
function normalizeRoad(tile: number) {
  return tile >= TileValues.ROADBASE && tile <= TileValues.LASTROAD + 1 ? (tile & 15) + 64 : tile;
}
function randomFire() {
  return new Tile(TileValues.FIRE + (Random.getRandom16() & 3), ANIMBIT);
}
function randomRubble() {
  return new Tile(TileValues.RUBBLE + (Random.getRandom16() & 3), BULLBIT);
}

const tileUtilsController = {
  canBulldoze,
  isCommercial,
  isCommercialZone,
  isDriveable,
  isFire,
  isFlood,
  isIndustrial,
  isIndustrialZone,
  isManualExplosion,
  isRail,
  isResidential,
  isResidentialZone,
  isRoad,
  normalizeRoad,
  randomFire,
  randomRubble,
};

export { tileUtilsController };