
import { forEachCardinalDirection, type Direction } from "../utils/direction";
import type { GameMap } from "../map/gameMap-ts";
import { miscUtilsController } from "../utils/miscUtils-ts";
import { Position } from "../utils/position";
import { Random } from "../utils/random";
import type { BlockMapSimulation } from "./simulation-ts";
import { SPRITE_HELICOPTER } from "../utils/spriteConstants";
import type { iSpriteManager } from "../sprites/spriteManager-ts";
import { spriteUtilsController } from "../sprites/spriteUtils-ts";
import { tileUtilsController, type iTileUtils } from "../tiles/tileUtils-ts";
// import { TileUtils } from "./tileUtils";
import { DIRT, POWERBASE, ROADBASE } from "../tiles/tileValues";

export type iTraffic = typeof trafficController;
export const trafficController = {
  _map: null as GameMap,
  tileUtils: null as iTileUtils,
  _stack: [],
  ROUTE_FOUND: miscUtilsController.makeConstantDescriptor(1),
  NO_ROUTE_FOUND: miscUtilsController.makeConstantDescriptor(0),
  NO_ROAD_FOUND: miscUtilsController.makeConstantDescriptor(-1),
  _spriteManager: null as iSpriteManager,
  perimX: [-1, 0, 1, 2, 2, 2, 1, 0, -1, -2, -2, -2],
  perimY: [-2, -2, -2, -1, 0, 1, 2, 2, 2, 1, 0, -1],
  MAX_TRAFFIC_DISTANCE: 30,
  create(map: GameMap, spriteManager: iSpriteManager) {
    this.tileUtils = tileUtilsController;
    this._map = map;
    this._spriteManager = spriteManager;

    return this;
  },
  makeTraffic(x: number, y: number, blockMaps: BlockMapSimulation, destFn) {
    this._stack = [];
    const pos = new Position(x, y);

    if (this.findPerimeterRoad(pos)) {
      if (this.tryDrive(pos, destFn)) {
        this.addToTrafficDensityMap(blockMaps);
        return this.ROUTE_FOUND;
      }
      return this.NO_ROUTE_FOUND;
    } else {
      return this.NO_ROAD_FOUND;
    }
  },
  findPerimeterRoad(position: Position) {
    for (var i = 0; i < 12; i++) {
      const xx = position.x + this.perimX[i];
      const yy = position.y + this.perimY[i];

      if (this._map.testBounds(xx, yy)) {
        if (this.tileUtils.isDriveable(this._map.getTileValue(xx, yy))) {
          position.x = xx;
          position.y = yy;
          return true;
        }
      }
    }

    return false;
  },
  tryDrive(position: Position, destFn: Function) {
    let dirLast: Direction;
    let drivePos = new Position(position.x, position.y);

    /* Maximum distance to try */
    for (let dist = 0; dist < this.MAX_TRAFFIC_DISTANCE; dist++) {
      const dir = this.tryGo(drivePos, dirLast);
      if (dir) {
        drivePos = Position.move(position, dir);
        dirLast = dir.oppositeDirection();

        if (dist & 1) {
          this._stack.push(new Position(drivePos.x, drivePos.y));
        }

        if (this.driveDone(drivePos, destFn)) {
          return true;
        }
      } else {
        if (this._stack.length > 0) {
          this._stack.pop();
          dist += 3;
        } else {
          return false;
        }
      }
    }

    return false;
  },
  tryGo(pos: Position, dirLast: Direction): Direction {
    const directions: Direction[] = [];

    // Find connections from current position.
    let count = 0;

    forEachCardinalDirection((dir) => {
      if (dir != dirLast && this.tileUtils.isDriveable(this._map.getTileFromMapOrDefault(pos, dir, DIRT))) {
        directions.push(dir);
        count++;
      }
    });

    if (count === 0) {
      return;
    }

    if (count === 1) {
      return directions[0];
    }

    const index = Random.getRandom(directions.length - 1);
    return directions[index];
  },
  driveDone(pos: Position, destFn: Function) {
    if (pos.y > 0) {
      if (destFn(this._map.getTileValue(pos.x, pos.y - 1))) return true;
    }

    if (pos.x < this._map.width - 1) {
      if (destFn(this._map.getTileValue(pos.x + 1, pos.y))) return true;
    }

    if (pos.y < this._map.height - 1) {
      if (destFn(this._map.getTileValue(pos.x, pos.y + 1))) return true;
    }

    if (pos.x > 0) {
      if (destFn(this._map.getTileValue(pos.x - 1, pos.y))) return true;
    }

    return false;
  },
  addToTrafficDensityMap(blockMaps: BlockMapSimulation) {
    const trafficDensityMap = blockMaps.trafficDensityMap;
    while (this._stack.length > 0) {
      const pos = this._stack.pop();

      // Could this happen?!?
      if (!this._map.testBounds(pos.x, pos.y)) continue;

      const tileValue = this._map.getTileValue(pos.x, pos.y);

      if (tileValue >= ROADBASE && tileValue < POWERBASE) {
        // Update traffic density.
        let traffic = trafficDensityMap.worldGet(pos.x, pos.y);
        traffic += 50;
        traffic = Math.min(traffic, 240);
        trafficDensityMap.worldSet(pos.x, pos.y, traffic);

        // Attract traffic copter to the traffic
        if (traffic >= 240 && Random.getRandom(5) === 0) {
          const sprite = this._spriteManager.getSprite(SPRITE_HELICOPTER);
          if (sprite !== null) {
            sprite.destX = spriteUtilsController.worldToPix(pos.x);
            sprite.destY = spriteUtilsController.worldToPix(pos.y);
          }
        }
      }
    }
  },
};
