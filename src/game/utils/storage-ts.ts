import { type GameMap } from "../map/gameMap-ts";
import { miscUtilsController } from "./miscUtils-ts";

export const storageController = {
  KEY: "webCityJSGame",
  CURRENT_VERSION: miscUtilsController.makeConstantDescriptor(3),
  getSavedGame() {
    let local: GameMap | string = localStorage.getItem(this.KEY);
    let savedGame: GameMap;
    if (local !== null) {
      savedGame = JSON.parse(local);

      if (savedGame.version.value !== this.CURRENT_VERSION.value) {
        this.transitionOldSave(savedGame);
      }
      // Flag as a saved game for Game/Simulation etc...

      savedGame.isSavedGame = true;
    }
    return savedGame;
  },
  transitionOldSave(savedGame) {
    switch (savedGame.version.value) {
      case 1:
        savedGame.everClicked = false;

      /* falls through */
      case 2:
        savedGame.pollutionMaxX = Math.floor(savedGame.width / 2);
        savedGame.pollutionMaxY = Math.floor(savedGame.height / 2);
        savedGame.cityCentreX = Math.floor(savedGame.width / 2);
        savedGame.cityCentreY = Math.floor(savedGame.height / 2);

        break;

      default:
        throw new Error("Unknown save version!");
    }
  },
  saveGame(gameData: any) {
    gameData.version = this.CURRENT_VERSION;
    gameData = JSON.stringify(gameData);

    localStorage.setItem(this.KEY, gameData);
  },
};
