import { messageTypes, utilController } from "../controller/util.controller.ts";
import { modalStore } from "../stores/modal.store.ts";
import { monsterStore } from "../stores/monster.store.ts";
import { notificationStore } from "../stores/notification.store.ts";
import { baseToolController } from "./tools/baseTool-ts.ts";
import { Config } from "./utils/config-ts.ts";
import { gameCanvasController, type iGameCanvas } from "./gameCanvas-ts.ts";
import { gameMapController, type GameMap } from "./map/gameMap-ts.ts";

import { infoBarController, type iInfoBar } from "./utils/infoBar-ts.ts";
import { inputStatusController, type iInputStatus } from "./inputStatus-ts.ts";
import * as Messages from "./utils/messages.ts";
import { rciController, type iRCI } from "./simulation/rci-ts.ts";
import { simulationController, type iSimulation } from "./simulation/simulation-ts.ts";
import { storageController } from "./utils/storage-ts.ts";
import { textUtils } from "./utils/text-ts.ts";
import type { iTyleSet } from "./tiles/tileSet-ts.ts";
const touchListener = function () {
  //window.removeEventListener("touchstart", this.touchListener, false);

  modalStore().setOpenTouchWarn(true);
};
const commonAnimate = function () {
  // if (gameController.dialogShowing) {
  //   nextFrame(gameController.animate);
  //   return;
  // }
  // gameController.dialogShowing = true;

  if (!gameController.isPaused) {
    gameController.simulation.spriteManager.moveObjects(gameController.simulation._constructSimData());
  }
  const sprites = gameController.calculateSpritesForPaint(gameController.gameCanvas);
  gameController.gameCanvas.paint(gameController.mouse, sprites, gameController.isPaused);

  nextFrame(gameController.animate);
};
const debugAnimate = function () {
  const date = new Date().getTime();
  let elapsed = Math.floor((date - gameController.animStart) / 1000);

  if (elapsed > gameController.lastElapsed && gameController.frameCount > 0) {
    const fpsSpan = document.querySelector("#fpsValue");
    if (fpsSpan) {
      fpsSpan.innerHTML = String(Math.floor(gameController.frameCount / elapsed));
    }

    gameController.lastElapsed = elapsed;
  }

  gameController.frameCount++;
  gameController.commonAnimate();
};
const tick = function () {
  gameController.handleInput();
  // && !$("#tooSmall").is(":visible")
  if (!gameController.simulation.isPaused()) {
    gameController.simulation.simTick();
  }
  // Run this even when paused: you can still build when paused
  gameController.mouse = gameController.calculateMouseForPaint();
  window.setTimeout(gameController.tick, 0);
};
const nextFrame = window.requestAnimationFrame;
export const gameController = {
  gameMap: null as GameMap,
  tileSet: null as iTyleSet,
  snowTileSet: null as iTyleSet,
  defaultSpeed: simulationController.SPEED_MED,
  simulation: null as iSimulation,
  name: "",
  everClicked: false,
  rci: null as iRCI,
  gameCanvas: null as iGameCanvas,
  inputStatus: null as iInputStatus,
  dialogOpen: false,
  _openWindow: null,
  mouse: null,
  lastCoord: null,
  simNeededBudget: false,
  isPaused: false,
  lastBadMessageTime: null,
  nagger: 0,
  _reachedTown: false,
  _reachedCity: false,
  _reachedCapital: false,
  _reachedMetropolis: false,
  _reachedMegalopolis: false,
  disasterTimeout: 20 * 1000,
  infoBar: null as iInfoBar,
  touchListener: null as EventListenerOrEventListenerObject,
  frameCount: 0,
  animStart: null,
  lastElapsed: -1,
  animate: null,
  tick: null,
  _map: null as GameMap,
  dialogShowing: false,
  commonAnimate: null,
  init(gameMap: GameMap, tileSet: iTyleSet, snowTileSet: iTyleSet, spriteSheet: HTMLImageElement, difficulty?: number, name?: string) {
    difficulty = difficulty || 0;
    let savedGame;
    if (gameMap && !gameMap.isSavedGame) {
      this.gameMap = gameMap;
      this._map = gameMap;
      savedGame = null;
    } else {
      this.gameMap = gameMapController.create(320, 200);
      savedGame = gameMap;
      this._map = gameMap;
    }
    this.tileSet = tileSet;
    this.snowTileSet = snowTileSet;
    this.simulation = simulationController.create(this.gameMap, difficulty, this.defaultSpeed, savedGame);
    this.name = name || "MyTown";
    if (savedGame) {
      this.load(savedGame);
    }
    // this.rci = new RCI("RCIContainer", this.simulation);
    this.rci = rciController.create("RCIContainer", this.simulation);

    // Note: must init canvas before inputStatus
    this.gameCanvas = gameCanvasController.create("canvasContainer");
    this.gameCanvas.init(this.gameMap, this.tileSet, spriteSheet);
    this.inputStatus = inputStatusController.create(gameMap, this.tileSet.tileWidth);

    if (!this.everClicked) {
      this.nagger = window.setTimeout(
        () => {
          modalStore().setOpenNagWindow(true);
        },
        30 * 60 * 1000,
      );
    }
    monsterStore().setData({ gameMap: this.gameMap, tileSet: tileSet, spriteSheet, animationManager: this.gameCanvas.animationManager });
    this.inputStatus.addEventListener(Messages.SAVE_REQUESTED, this.handleSave.bind(this));
    this.inputStatus.addEventListener(Messages.FRONT_END_MESSAGE, this.processFrontEndMessage.bind(this));
    // Listen for tool clicks
    this.inputStatus.addEventListener(Messages.TOOL_CLICKED, this.handleTool.bind(this));
    // And pauses
    this.inputStatus.addEventListener(Messages.SPEED_CHANGE, this.handlePause.bind(this));
    // And date changes
    // XXX Not yet activated
    //this.simulation.addEventListener(Messages.DATE_UPDATED, this.onDateChange.bind(this));

    this.infoBar = infoBarController;
    const initialValues = {
      classification: String(this.simulation.evaluation.cityClass),
      population: this.simulation.evaluation.cityPop,
      score: this.simulation.evaluation.cityScore,
      funds: this.simulation.budget.totalFunds,
      date: { month: String(this.simulation.getDate().month), year: String(this.simulation.getDate().year) },
      name: this.name,
    };
    this.infoBar.init(this.simulation, initialValues);
    notificationStore().setNotification(textUtils.messageText[Messages.WELCOME], "neutral");
    // Track when various milestones are first reached
    this._reachedTown = this._reachedCity = this._reachedCapital = this._reachedMetropolis = this._reachedMegalopolis = false;
    // Listen for touches, so we can warn tablet users
    this.touchListener = touchListener.bind(this);
    window.addEventListener("touchstart", this.touchListener, false);
    // Unhide controls
    this.revealControls();
    // Run the sim
    this.tick = tick.bind(this);
    this.tick();
    //paint the map
    const debug = Config.debug || Config.gameDebug;
    if (debug) {
      // $("#debug").toggle();
      this.frameCount = 0;
      this.animStart = new Date();
      this.lastElapsed = -1;
    }
    this.commonAnimate = commonAnimate.bind(this);
    this.animate = (debug ? debugAnimate : this.commonAnimate).bind(this);

    this.animate();
    return this;
  },

  calculateSpritesForPaint(canvas: iGameCanvas) {
    const origin = canvas.getTileOrigin();
    const spriteList = this.simulation.spriteManager.getSpritesInView(origin.x, origin.y, canvas.canvasWidth, canvas.canvasHeight);

    if (spriteList.length === 0) return null;

    return spriteList;
  },

  calculateMouseForPaint() {
    // Determine whether we need to draw a tool outline in the
    // canvas
    let mouse = null;

    if (this.inputStatus.mouseX !== -1 && this.inputStatus.toolWidth > 0) {
      const tileCoords = this.gameCanvas.canvasCoordinateToTileOffset(this.inputStatus.mouseX, this.inputStatus.mouseY);
      if (tileCoords !== null) {
        mouse = {};

        mouse.x = tileCoords.x;
        mouse.y = tileCoords.y;

        // The inputStatus fields came from DOM attributes, so will be strings.
        // Coerce back to numbers.
        mouse.width = this.inputStatus.toolWidth - 0;
        mouse.height = this.inputStatus.toolWidth - 0;
        mouse.colour = this.inputStatus.toolColour || "yellow";
      }
    }
    return mouse;
  },
  handleInput() {
    if (this.inputStatus.left) {
      this.gameCanvas.moveWest();
    } else if (this.inputStatus.up) {
      this.gameCanvas.moveNorth();
    } else if (this.inputStatus.right) {
      this.gameCanvas.moveEast();
    } else if (this.inputStatus.down) {
      this.gameCanvas.moveSouth();
    }
    if (this.inputStatus.escape) {
      modalStore().closeAll();
      this.inputStatus.clearTool();
    }
  },
  revealControls() {
    const hiddens = document.querySelectorAll(".initialHidden");
    hiddens.forEach((item) => {
      item.classList.remove("initialHidden");
    });
    this.rci.update({ residential: 750, commercial: 750, industrial: 750 });
  },
  handlePause(value) {
    let pause = value === "Play" ? false : true;
    this.isPaused = pause;
    if (this.isPaused) {
      this.simulation.setSpeed(simulationController.SPEED_PAUSED);
    } else {
      this.simulation.setSpeed(this.defaultSpeed);
    }
  },
  handleTool(data) {
    const x = data.x;
    const y = data.y;
    const tileCoords = this.gameCanvas.canvasCoordinateToTileCoordinate(x, y);
    if (tileCoords === null) {
      return;
    }
    const tool = this.inputStatus.currentTool;
    const budget = this.simulation.budget;

    //do it

    if (this.inputStatus.toolName === "query") {
      modalStore().setOpenQuery(true, tileCoords.x, tileCoords.y, this.simulation.blockMaps);
    } else {
      tool.doTool(tileCoords.x, tileCoords.y, this.simulation.blockMaps);
      tool.modifyIfEnoughFunding(budget);
      switch (tool.result) {
        case tool.TOOLRESULT_NEEDS_BULLDOZE:
          utilController.snackbar(textUtils.toolMessages.needsDoze, messageTypes.error);
          // $("#toolOutput").text(textUtils.toolMessages.needsDoze);
          break;

        case tool.TOOLRESULT_NO_MONEY:
          utilController.snackbar(textUtils.toolMessages.noMoney, messageTypes.error);
          break;
      }
    }
  },
  processFrontEndMessage(message) {
    const subject = message.subject;
    const d = new Date();
    if (textUtils.goodMessages[subject] !== undefined) {
      let cMessage = this.name + " is now a ";
      switch (subject) {
        case Messages.REACHED_CAPITAL:
          if (!this._reachedCapital) {
            this._reachedCapital = true;
            cMessage += "capital!";
          }
          break;

        case Messages.REACHED_CITY:
          if (!this._reachedCity) {
            this._reachedCity = true;
            cMessage += "city!";
          }
          break;

        case Messages.REACHED_MEGALOPOLIS:
          if (!this._reachedMegalopolis) {
            this._reachedMegalopolis = true;
            cMessage += "megalopolis!";
          }
          break;

        case Messages.REACHED_METROPOLIS:
          if (!this._reachedMetropolis) {
            this._reachedMetropolis = true;
            cMessage += "metropolis!";
          }
          break;

        case Messages.REACHED_TOWN:
          if (!this._reachedTown) {
            this._reachedTown = true;
            cMessage += "town!";
          }
          break;
      }
      if (this.lastBadMessageTime === null || d.getTime() - this.lastBadMessageTime > this.disasterTimeout) {
        this.lastBadMessageTime = null;
        notificationStore().setNotification(textUtils.messageText[message.subject ?? message], "good");
        if (message.data) {
          notificationStore().setData(message.data);
        } else {
          notificationStore().clearData();
        }
      }
      if (cMessage !== this.name + " is now a") {
        let capitalize = cMessage.substring(0, 1).toUpperCase() + cMessage.substring(1);
        modalStore().setOpenCongrats(true, capitalize);
      }
      return;
    }
    if (textUtils.badMessages[subject] !== undefined) {
      notificationStore().setNotification(textUtils.messageText[message.subject ?? message], "bad");
      if (message.data) {
        notificationStore().setData(message.data);
      } else {
        notificationStore().clearData();
      }

      if (Messages.DISASTER_MESSAGES.indexOf(message.subject) !== -1) this.lastBadMessageTime = d;
      return;
    }
    if (textUtils.neutralMessages[subject] !== undefined) {
      if (this.lastBadMessageTime === null || d.getTime() - this.lastBadMessageTime > this.disasterTimeout) {
        this.lastBadMessageTime = null;
        notificationStore().setNotification(textUtils.messageText[message.subject ?? message], "neutral");
        if (message.data) {
          notificationStore().setData(message.data);
        } else {
          notificationStore().clearData();
        }
      }
      return;
    }
    console.warn("Unexpected message: ", subject);
  },
  handleSave() {
    this.save();
    modalStore().setOpenSave(true, "Game saved!");
  },
  save() {
    const saveData = { name: this.name, everClicked: this.everClicked };
    baseToolController.save(saveData);

    this.simulation.save(saveData);

    storageController.saveGame(saveData);
  },
  load(saveData) {
    this.name = saveData.name;
    this.everClicked = saveData.everClicked;
    baseToolController.load(saveData);
    this.simulation.load(saveData);
  },
};
