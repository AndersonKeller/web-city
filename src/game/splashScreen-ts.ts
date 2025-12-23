
import { gameController } from "./game-ts";
import type { GameMap } from "./map/gameMap-ts";
import { mapGeneratorController } from "./map/mapGenerator-ts";
import { splashCanvasController, type iSplashCanvas } from "./canvas/splashCanvas-ts";

import { storageController } from "./utils/storage-ts";

import { type iTyleSet } from "./tiles/tileSet-ts";

export const splashScreenController = {
  tileSet: null as iTyleSet,
  snowTileSet: null as iTyleSet,
  spriteSheet: null as HTMLImageElement,
  map: null as GameMap,
  splashCanvas: null as iSplashCanvas,
  create(tileSet: iTyleSet, snowTileSet: iTyleSet, spriteSheet: HTMLImageElement) {
    this.tileSet = tileSet;
    this.snowTileSet = snowTileSet;
    this.spriteSheet = spriteSheet;
    this.map = mapGeneratorController.create();

    // Paint the minimap
    this.splashCanvas = splashCanvasController.create("splashContainer", tileSet);
    this.splashCanvas.paint(this.map);
    // Let's get some bits on screen!
    const awaitGeneration = document.querySelector("#splash");

    awaitGeneration.classList.toggle("awaitGeneration");
  },
  regenerateMap() {
    this.map = mapGeneratorController.create();
    this.splashCanvas.paint(this.map);
  },
  handleLoad() {
    const savedGame = storageController.getSavedGame();
    if (savedGame === null) return;

    const game = gameController.init(savedGame, this.tileSet, this.tileSet, this.spriteSheet);

    return game;
  },
  play(gameData: { name: string; dificulty: number }) {
    // Launch a new game

    const game = gameController.init(this.map, this.tileSet, this.tileSet, this.spriteSheet, gameData.dificulty, gameData.name);

    return game;
  },
};
