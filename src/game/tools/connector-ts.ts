import type { iBaseToolConnector } from "./buildingTool-ts.ts";
import { BLBNCNBIT, BULLBIT, BURNBIT } from "../tiles/tileFlags.ts";
import { tileUtilsController } from "../tiles/tileUtils-ts.ts";
import * as TileValues from "../tiles/tileValues.ts";
const RoadTable = [
  TileValues.ROADS,
  TileValues.ROADS2,
  TileValues.ROADS,
  TileValues.ROADS3,
  TileValues.ROADS2,
  TileValues.ROADS2,
  TileValues.ROADS4,
  TileValues.ROADS8,
  TileValues.ROADS,
  TileValues.ROADS6,
  TileValues.ROADS,
  TileValues.ROADS7,
  TileValues.ROADS5,
  TileValues.ROADS10,
  TileValues.ROADS9,
  TileValues.INTERSECTION,
];
const RailTable = [
  TileValues.LHRAIL,
  TileValues.LVRAIL,
  TileValues.LHRAIL,
  TileValues.LVRAIL2,
  TileValues.LVRAIL,
  TileValues.LVRAIL,
  TileValues.LVRAIL3,
  TileValues.LVRAIL7,
  TileValues.LHRAIL,
  TileValues.LVRAIL5,
  TileValues.LHRAIL,
  TileValues.LVRAIL6,
  TileValues.LVRAIL4,
  TileValues.LVRAIL9,
  TileValues.LVRAIL8,
  TileValues.LVRAIL10,
];

const WireTable = [
  TileValues.LHPOWER,
  TileValues.LVPOWER,
  TileValues.LHPOWER,
  TileValues.LVPOWER2,
  TileValues.LVPOWER,
  TileValues.LVPOWER,
  TileValues.LVPOWER3,
  TileValues.LVPOWER7,
  TileValues.LHPOWER,
  TileValues.LVPOWER5,
  TileValues.LHPOWER,
  TileValues.LVPOWER6,
  TileValues.LVPOWER4,
  TileValues.LVPOWER9,
  TileValues.LVPOWER8,
  TileValues.LVPOWER10,
];
const fixSingle = function (this: iBaseToolConnector, x: number, y: number) {
  let adjTile = 0;
  const tileMap = this._worldEffects.getTile(x, y);
  let tile = tileUtilsController.normalizeRoad(tileMap.getValue());
  if (tile >= TileValues.ROADS && tile <= TileValues.INTERSECTION) {
    if (y > 0) {
      tile = this._worldEffects.getTileValue(x, y - 1);
      tile = tileUtilsController.normalizeRoad(tile);

      if (
        (tile === TileValues.HRAILROAD || (tile >= TileValues.ROADBASE && tile <= TileValues.VROADPOWER)) &&
        tile !== TileValues.HROADPOWER &&
        tile !== TileValues.VRAILROAD &&
        tile !== TileValues.ROADBASE
      )
        adjTile |= 1;
    }

    if (x < this._map.width - 1) {
      tile = this._worldEffects.getTileValue(x + 1, y);
      tile = tileUtilsController.normalizeRoad(tile);

      if (
        (tile === TileValues.VRAILROAD || (tile >= TileValues.ROADBASE && tile <= TileValues.VROADPOWER)) &&
        tile !== TileValues.VROADPOWER &&
        tile !== TileValues.HRAILROAD &&
        tile !== TileValues.VBRIDGE
      )
        adjTile |= 2;
    }

    if (y < this._map.height - 1) {
      tile = this._worldEffects.getTileValue(x, y + 1);
      tile = tileUtilsController.normalizeRoad(tile);

      if (
        (tile === TileValues.HRAILROAD || (tile >= TileValues.ROADBASE && tile <= TileValues.VROADPOWER)) &&
        tile !== TileValues.HROADPOWER &&
        tile !== TileValues.VRAILROAD &&
        tile !== TileValues.ROADBASE
      )
        adjTile |= 4;
    }

    if (x > 0) {
      tile = this._worldEffects.getTileValue(x - 1, y);
      tile = tileUtilsController.normalizeRoad(tile);

      if (
        (tile === TileValues.VRAILROAD || (tile >= TileValues.ROADBASE && tile <= TileValues.VROADPOWER)) &&
        tile !== TileValues.VROADPOWER &&
        tile !== TileValues.HRAILROAD &&
        tile !== TileValues.VBRIDGE
      )
        adjTile |= 8;
    }

    this._worldEffects.setTile(x, y, RoadTable[adjTile], BULLBIT | BURNBIT);
    return;
  }
  if (tile >= TileValues.LHRAIL && tile <= TileValues.LVRAIL10) {
    if (y > 0) {
      tile = this._worldEffects.getTileValue(x, y - 1);
      tile = tileUtilsController.normalizeRoad(tile);
      if (
        tile >= TileValues.RAILHPOWERV &&
        tile <= TileValues.VRAILROAD &&
        tile !== TileValues.RAILHPOWERV &&
        tile !== TileValues.HRAILROAD &&
        tile !== TileValues.HRAIL
      )
        adjTile |= 1;
    }

    if (x < this._map.width - 1) {
      tile = this._worldEffects.getTileValue(x + 1, y);
      tile = tileUtilsController.normalizeRoad(tile);
      if (
        tile >= TileValues.RAILHPOWERV &&
        tile <= TileValues.VRAILROAD &&
        tile !== TileValues.RAILVPOWERH &&
        tile !== TileValues.VRAILROAD &&
        tile !== TileValues.VRAIL
      )
        adjTile |= 2;
    }

    if (y < this._map.height - 1) {
      tile = this._worldEffects.getTileValue(x, y + 1);
      tile = tileUtilsController.normalizeRoad(tile);
      if (
        tile >= TileValues.RAILHPOWERV &&
        tile <= TileValues.VRAILROAD &&
        tile !== TileValues.RAILHPOWERV &&
        tile !== TileValues.HRAILROAD &&
        tile !== TileValues.HRAIL
      )
        adjTile |= 4;
    }

    if (x > 0) {
      tile = this._worldEffects.getTileValue(x - 1, y);
      tile = tileUtilsController.normalizeRoad(tile);
      if (
        tile >= TileValues.RAILHPOWERV &&
        tile <= TileValues.VRAILROAD &&
        tile !== TileValues.RAILVPOWERH &&
        tile !== TileValues.VRAILROAD &&
        tile !== TileValues.VRAIL
      )
        adjTile |= 8;
    }

    this._worldEffects.setTile(x, y, RailTable[adjTile], BULLBIT | BURNBIT);
    return;
  }
  if (tile >= TileValues.LHPOWER && tile <= TileValues.LVPOWER10) {
    if (y > 0) {
      const tilePower = this._worldEffects.getTile(x, y - 1);
      tile = tilePower.getValue();
      if (tilePower.isConductive()) {
        tile = tileUtilsController.normalizeRoad(tile);
        if (tile !== TileValues.VPOWER && tile !== TileValues.VROADPOWER && tile !== TileValues.RAILVPOWERH) adjTile |= 1;
      }
    }

    if (x < this._map.width - 1) {
      const tilePower = this._worldEffects.getTile(x + 1, y);
      tile = tilePower.getValue();
      if (tilePower.isConductive()) {
        tile = tileUtilsController.normalizeRoad(tile);
        if (tile !== TileValues.HPOWER && tile !== TileValues.HROADPOWER && tile !== TileValues.RAILHPOWERV) adjTile |= 2;
      }
    }

    if (y < this._map.height - 1) {
      const tilePower = this._worldEffects.getTile(x, y + 1);
      tile = tilePower.getValue();
      if (tilePower.isConductive()) {
        tile = tileUtilsController.normalizeRoad(tile);
        if (tile !== TileValues.VPOWER && tile !== TileValues.VROADPOWER && tile !== TileValues.RAILVPOWERH) adjTile |= 4;
      }
    }

    if (x > 0) {
      const tilePower = this._worldEffects.getTile(x - 1, y);
      tile = tilePower.getValue();
      if (tilePower.isConductive()) {
        tile = tileUtilsController.normalizeRoad(tile);
        if (tile !== TileValues.HPOWER && tile !== TileValues.HROADPOWER && tile !== TileValues.RAILHPOWERV) adjTile |= 8;
      }
    }

    this._worldEffects.setTile(x, y, WireTable[adjTile], BLBNCNBIT);
    return;
  }
};
const checkZoneConnections = function (this: iBaseToolConnector, x: number, y: number) {
  this.fixSingle(x, y);

  if (y > 0) this.fixSingle(x, y - 1);

  if (x < this._map.width - 1) this.fixSingle(x + 1, y);

  if (y < this._map.height - 1) this.fixSingle(x, y + 1);

  if (x > 0) this.fixSingle(x - 1, y);
};
const checkBorder = function (this: iBaseToolConnector, x: number, y: number, size: number) {
  x = x - 1;
  y = y - 1;

  var i;

  for (i = 0; i < size; i++) this.fixZone(x + i, y - 1);

  for (i = 0; i < size; i++) this.fixZone(x - 1, y + i);

  for (i = 0; i < size; i++) this.fixZone(x + i, y + size);

  for (i = 0; i < size; i++) this.fixZone(x + size, y + i);
};
export function Connector(toolConstructor: iBaseToolConnector) {
  toolConstructor.prototype.checkZoneConnections = checkZoneConnections;
  toolConstructor.prototype.fixSingle = fixSingle;
  toolConstructor.prototype.checkBorder = checkBorder;

  return toolConstructor;
}