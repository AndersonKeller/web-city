import { gameMapController, type GameMap } from "./gameMap-ts.ts";
import { getRandomCardinalDirection, getRandomDirection, type Direction } from "../utils/direction.ts";

import { Position } from "../utils/position.ts";
import { Random } from "../utils/random.ts";
import { BLBNBIT, BULLBIT } from "../tiles/tileFlags.ts";
import { CHANNEL, DIRT, REDGE, RIVER, WOODS, WOODS_LOW, WOODS_HIGH } from "../tiles/tileValues.ts";
export type MapGenerator = typeof mapGeneratorController;

export const mapGeneratorController = {
  riverEdges: [
    13 | BULLBIT,
    13 | BULLBIT,
    17 | BULLBIT,
    15 | BULLBIT,
    5 | BULLBIT,
    RIVER,
    19 | BULLBIT,
    17 | BULLBIT,
    9 | BULLBIT,
    11 | BULLBIT,
    RIVER,
    13 | BULLBIT,
    7 | BULLBIT,
    9 | BULLBIT,
    5 | BULLBIT,
    RIVER,
  ],
  treeTable: [0, 0, 0, 34, 0, 0, 36, 35, 0, 32, 0, 33, 30, 31, 29, 37],
  TERRAIN_CREATE_ISLAND: 0,
  ISLAND_RADIUS: 18,
  TERRAIN_TREE_LEVEL: -1,
  TERRAIN_LAKE_LEVEL: -1,
  TERRAIN_CURVE_LEVEL: -1,
  map: null as GameMap,
  create(width?: number | null, heigth?: number | null): GameMap {
    width = width || 320;
    heigth = heigth || 200;
    this.TERRAIN_CREATE_ISLAND = Random.getRandom(2) - 1;
    this.map = gameMapController.create(width, heigth);

    // Construct land.
    if (this.TERRAIN_CREATE_ISLAND < 0) {
      if (Random.getRandom(100) < 10) {
        this.makeIsland();
        return this.map;
      }
    }
    if (this.TERRAIN_CREATE_ISLAND === 1) this.makeNakedIsland();
    else this.clearMap();

    // Lay a river.
    if (this.TERRAIN_CURVE_LEVEL !== 0) {
      const terrainXStart = 40 + Random.getRandom(this.map.width - 80);
      const terrainYStart = 33 + Random.getRandom(this.map.height - 67);

      const terrainPos = new Position(terrainXStart, terrainYStart);
      this.doRivers(terrainPos);
    }
    // Lay a few lakes.
    if (this.TERRAIN_LAKE_LEVEL !== 0) this.makeLakes();

    this.smoothRiver();
    // And add trees.
    if (this.TERRAIN_TREE_LEVEL !== 0) this.doTrees();

    return this.map;
  },
  clearMap() {
    for (var x = 0; x < this.map.width; x++) {
      for (var y = 0; y < this.map.height; y++) {
        this.map.setTile(x, y, DIRT, 0);
      }
    }
  },
  makeLakes() {
    let numLakes;
    if (this.TERRAIN_LAKE_LEVEL < 0) {
      numLakes = Random.getRandom(10);
    } else {
      numLakes = this.TERRAIN_LAKE_LEVEL / 2;
    }

    while (numLakes > 0) {
      var x = Random.getRandom(this.map.width - 21) + 10;
      var y = Random.getRandom(this.map.height - 20) + 10;

      this.makeSingleLake(new Position(x, y));
      numLakes--;
    }
  },
  makeSingleLake(position: Position) {
    let numPlops = Random.getRandom(12) + 2;
    while (numPlops > 0) {
      let plopPos = new Position(position.x, Random.getRandom(12) - 6);

      if (Random.getRandom(4)) this.plopSRiver(plopPos);
      else this.plopBRiver(plopPos);

      numPlops--;
    }
  },
  makeIsland() {
    this.makeNakedIsland();
    this.smoothRiver();
    this.doTrees();
  },
  makeNakedIsland() {
    var terrainIslandRadius = this.ISLAND_RADIUS;
    let x, y;
    for (x = 0; x < this.map.width; x++) {
      for (y = 0; y < this.map.height; y++) {
        if (x < 5 || x >= this.map.width - 5 || y < 5 || y >= this.map.height - 5) {
          this.map.setTile(x, y, RIVER, 0);
        } else {
          this.map.setTile(x, y, DIRT, 0);
        }
      }
    }
    for (x = 0; x < this.map.width - 5; x += 2) {
      var mapY = Random.getERandom(terrainIslandRadius);
      this.plopBRiver(new Position(x, mapY));

      mapY = this.map.height - 10 - Random.getERandom(terrainIslandRadius);
      this.plopBRiver(new Position(x, mapY));

      this.plopSRiver(new Position(x, 0));
      this.plopSRiver(new Position(x, this.map.height - 6));
    }
    for (y = 0; y < this.map.height - 5; y += 2) {
      var mapX = Random.getERandom(terrainIslandRadius);
      this.plopBRiver(new Position(mapX, y));

      mapX = this.map.width - 10 - Random.getERandom(terrainIslandRadius);
      this.plopBRiver(new Position(mapX, y));

      this.plopSRiver(new Position(0, y));
      this.plopSRiver(new Position(this.map.width - 6, y));
    }
  },
  smoothRiver() {
    const dx = [-1, 0, 1, 0];
    const dy = [0, 1, 0, -1];

    for (var x = 0; x < this.map.width; x++) {
      for (var y = 0; y < this.map.height; y++) {
        if (this.map.getTileValue(x, y) === REDGE) {
          var bitIndex = 0;

          for (var z = 0; z < 4; z++) {
            bitIndex = bitIndex << 1;
            var xTemp = x + dx[z];
            var yTemp = y + dy[z];
            if (
              this.map.testBounds(xTemp, yTemp) &&
              this.map.getTileValue(xTemp, yTemp) !== DIRT &&
              (this.map.getTileValue(xTemp, yTemp) < WOODS_LOW || this.map.getTileValue(xTemp, yTemp) > WOODS_HIGH)
            ) {
              bitIndex++;
            }
          }

          var temp = this.riverEdges[bitIndex & 15];
          if (temp !== RIVER && Random.getRandom(1)) temp++;

          this.map.setTileValue(x, y, temp);
        }
      }
    }
  },
  doRivers(terrainPos: Position) {
    let riverDir = getRandomCardinalDirection();
    this.doBRiver(terrainPos, riverDir, riverDir);

    riverDir = riverDir.oppositeDirection();
    let terrainDir = this.doBRiver(terrainPos, riverDir, riverDir);

    riverDir = getRandomCardinalDirection();
    this.doSRiver(terrainPos, riverDir, terrainDir);
  },
  doTrees() {
    let amount;
    if (this.TERRAIN_TREE_LEVEL < 0) amount = Random.getRandom(100) + 450;
    else amount = this.TERRAIN_TREE_LEVEL + 300;

    for (var x = 0; x < amount; x++) {
      var xloc = Random.getRandom(this.map.width - 1);
      var yloc = Random.getRandom(this.map.height - 1);
      this.treeSplash(xloc, yloc);
    }

    this.smoothTrees();
    this.smoothTrees();
  },
  doBRiver(position: Position, riverDir: Direction, terrainDir: Direction) {
    let rate1, rate2;
    if (this.TERRAIN_CURVE_LEVEL < 0) {
      rate1 = 100;
      rate2 = 200;
    } else {
      rate1 = this.TERRAIN_CURVE_LEVEL + 10;
      rate2 = this.TERRAIN_CURVE_LEVEL + 100;
    }
    while (this.map.testBounds(position.x + 4, position.y + 4)) {
      this.plopBRiver(position);
      if (Random.getRandom(rate1) < 10) {
        terrainDir = riverDir;
      } else {
        if (Random.getRandom(rate2) > 90) {
          terrainDir = terrainDir.rotateClockwise();
        }
        if (Random.getRandom(rate2) > 90) {
          terrainDir = terrainDir.rotateCounterClockwise();
        }
      }
      position = Position.move(position, terrainDir);
    }
    return terrainDir;
  },
  doSRiver(position: Position, riverDir: Direction, terrainDir: Direction) {
    var rate1, rate2;

    if (this.TERRAIN_CURVE_LEVEL < 0) {
      rate1 = 100;
      rate2 = 200;
    } else {
      rate1 = this.TERRAIN_CURVE_LEVEL + 10;
      rate2 = this.TERRAIN_CURVE_LEVEL + 100;
    }

    while (this.map.testBounds(position.x + 3, position.y + 3)) {
      this.plopSRiver(position);
      if (Random.getRandom(rate1) < 10) {
        terrainDir = riverDir;
      } else {
        if (Random.getRandom(rate2) > 90) terrainDir = terrainDir.rotateClockwise();
        if (Random.getRandom(rate2) > 90) terrainDir = terrainDir.rotateCounterClockwise();
      }
      position = Position.move(position, terrainDir);
    }

    return terrainDir;
  },
  plopBRiver(position: Position) {
    const BRMatrix = [
      [0, 0, 0, REDGE, REDGE, REDGE, 0, 0, 0],
      [0, 0, REDGE, RIVER, RIVER, RIVER, REDGE, 0, 0],
      [0, REDGE, RIVER, RIVER, RIVER, RIVER, RIVER, REDGE, 0],
      [REDGE, RIVER, RIVER, RIVER, RIVER, RIVER, RIVER, RIVER, REDGE],
      [REDGE, RIVER, RIVER, RIVER, CHANNEL, RIVER, RIVER, RIVER, REDGE],
      [REDGE, RIVER, RIVER, RIVER, RIVER, RIVER, RIVER, RIVER, REDGE],
      [0, REDGE, RIVER, RIVER, RIVER, RIVER, RIVER, REDGE, 0],
      [0, 0, REDGE, RIVER, RIVER, RIVER, REDGE, 0, 0],
      [0, 0, 0, REDGE, REDGE, REDGE, 0, 0, 0],
    ] as const;

    for (var x = 0; x < 9; x++) {
      for (var y = 0; y < 9; y++) {
        this.putOnMap(BRMatrix[y][x], position.x + x, position.y + y);
      }
    }
  },
  plopSRiver(position: Position) {
    const SRMatrix = [
      [0, 0, REDGE, REDGE, 0, 0],
      [0, REDGE, RIVER, RIVER, REDGE, 0],
      [REDGE, RIVER, RIVER, RIVER, RIVER, REDGE],
      [REDGE, RIVER, RIVER, RIVER, RIVER, REDGE],
      [0, REDGE, RIVER, RIVER, REDGE, 0],
      [0, 0, REDGE, REDGE, 0, 0],
    ] as const;
    for (var x = 0; x < 6; x++) {
      for (var y = 0; y < 6; y++) {
        this.putOnMap(SRMatrix[y][x], position.x + x, position.y + y);
      }
    }
  },
  putOnMap(newVal: number, x: number, y: number) {
    if (newVal === 0) return;
    if (!this.map.testBounds(x, y)) return;

    const tileValue = this.map.getTileValue(x, y);
    if (tileValue !== DIRT) {
      if (tileValue === RIVER) {
        if (newVal !== CHANNEL) return;
      }
      if (tileValue === CHANNEL) return;
    }
    this.map.setTile(x, y, newVal, 0);
  },
  treeSplash(xloc: number, yloc: number) {
    let numTrees;
    if (this.TERRAIN_TREE_LEVEL < 0) numTrees = Random.getRandom(150) + 50;
    else numTrees = Random.getRandom(100 + this.TERRAIN_TREE_LEVEL * 2) + 50;

    let treePos = new Position(xloc, yloc);

    while (numTrees > 0) {
      const dir = getRandomDirection();
      treePos = Position.move(treePos, dir);

      if (!this.map.isPositionInBounds(treePos)) return;

      if (this.map.getTileValue(treePos.x, treePos.y) === DIRT) this.map.setTile(treePos.x, treePos.y, WOODS, BLBNBIT);

      numTrees--;
    }
  },
  isTree(tileValue: number) {
    return tileValue >= WOODS_LOW && tileValue <= WOODS_HIGH;
  },
  smoothTrees() {
    for (var x = 0; x < this.map.width; x++) {
      for (var y = 0; y < this.map.height; y++) {
        if (this.isTree(this.map.getTileValue(x, y))) this.smoothTreesAt(x, y, false);
      }
    }
  },
  smoothTreesAt(x: number, y: number, preserve: boolean) {
    const dx = [-1, 0, 1, 0];
    const dy = [0, 1, 0, -1];
    if (!this.isTree(this.map.getTileValue(x, y))) return;

    let bitIndex = 0;
    for (var i = 0; i < 4; i++) {
      bitIndex = bitIndex << 1;
      const xTemp = x + dx[i];
      const yTemp = y + dy[i];
      if (this.map.testBounds(xTemp, yTemp) && this.isTree(this.map.getTileValue(xTemp, yTemp))) bitIndex++;
    }

    let temp = this.treeTable[bitIndex & 15];
    if (temp) {
      if (temp !== WOODS) {
        if ((x + y) & 1) {
          temp = temp - 8;
        }
      }
      this.map.setTile(x, y, temp, BLBNBIT);
    } else {
      if (!preserve) this.map.setTileValue(x, y, temp);
    }
  },
};
