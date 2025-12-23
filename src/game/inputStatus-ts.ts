import { modalStore } from "../stores/modal.store.ts";
import { budgetController } from "./simulation/budget-ts.ts";
import { EventEmitter } from "./utils/eventEmitter-ts.ts";
import { gameCanvasController } from "./gameCanvas-ts";
import type { GameMap } from "./map/gameMap-ts.ts";
import { gameToolsController, type iGameTools } from "./tools/gameTools-ts.ts";
import * as Messages from "./utils/messages.ts";
import { miscUtilsController } from "./utils/miscUtils-ts.ts";

export interface iGameToolsInput extends iGameTools {
  addEventListener: (event: string, subject: Function) => {};
}
export interface iToolProps {
  name: string;
  width: number;
  color: string;
}
export type iInputStatus = typeof inputStatusController;
export const inputStatusController = {
  gameTools: null as iGameToolsInput,
  canvasID: gameCanvasController.DEFAULT_ID,
  _tileWidth: 0,
  up: false,
  down: false,
  left: false,
  right: false,
  escape: false,

  mouseX: -1,
  mouseY: -1,
  toolOutputID: "#toolOutput",
  _dragging: false,
  _lastDragX: -1,
  _lastDragY: -1,
  addEventListener: (event: string, subject?: Function) => {},
  toolName: null,
  currentTool: null,
  toolWidth: 0,
  toolColour: "",
  canvasElement: null as HTMLElement,

  create(map: GameMap, tileWidth: number) {
    this.gameTools = gameToolsController.create(map);
    this.gameTools.addEventListener(Messages.QUERY_WINDOW_NEEDED, miscUtilsController.reflectEvent.bind(this, Messages.QUERY_WINDOW_NEEDED));

    this._tileWidth = tileWidth;
    this.canvasElement = document.getElementById(this.canvasID);
    this.gameTools;

    EventEmitter(this);

    document.addEventListener("keydown", this.keyDownHandler.bind(this));
    document.addEventListener("keyup", this.keyUpHandler.bind(this));
    this.getRelativeCoordinates.bind(this);
    this.canvasElement.addEventListener("mouseenter", this.mouseEnterHandler.bind(this));
    this.canvasElement.addEventListener("mouseleave", this.mouseLeaveHandler.bind(this));

    this.mouseDownHandler.bind(this);
    this.mouseMoveHandler.bind(this);
    this.mouseUpHandler.bind(this);
    this.canvasClickHandler.bind(this);

    return this;
  },
  keyDownHandler(e) {
    let handled = false;
    switch (e.keyCode) {
      case 38:
      case 87:
        this.up = true;
        handled = true;
        break;

      case 40:
      case 83:
        this.down = true;
        handled = true;
        break;

      case 39:
      case 68:
        this.right = true;
        handled = true;
        break;

      case 37:
      case 65:
        this.left = true;
        handled = true;
        break;

      case 27:
        this.escape = true;
        handled = true;
    }
    if (handled) e.preventDefault();
  },
  keyUpHandler(e) {
    switch (e.keyCode) {
      case 38:
      case 87:
        this.up = false;
        break;

      case 40:
      case 83:
        this.down = false;
        break;

      case 39:
      case 68:
        this.right = false;
        break;

      case 37:
      case 65:
        this.left = false;
        break;

      case 27:
        this.escape = false;
    }
  },
  mouseEnterHandler(e) {
    if (this.currentTool === null) return;

    this.canvasElement.addEventListener("mousemove", this.mouseMoveHandler.bind(this));

    if (this.currentTool.isDraggable) {
      this.canvasElement.addEventListener("mousedown", this.mouseDownHandler.bind(this));
    } else {
      this.canvasElement.addEventListener("click", this.canvasClickHandler.bind(this));
    }
  },
  mouseUpHandler(e) {
    this._dragging = false;
    this._lastDragX = -1;
    this._lastDragY = -1;
    this.canvasElement.removeEventListener("mouseup", this.mouseUpHandler);
    e.preventDefault();
  },
  mouseDownHandler(e) {
    if (e.which !== 1 || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;

    const coords = this.getRelativeCoordinates(e);
    this.mouseX = coords.x;
    this.mouseY = coords.y;

    this._dragging = true;
    this._emitEvent(Messages.TOOL_CLICKED, { x: this.mouseX, y: this.mouseY });

    this._lastDragX = Math.floor(this.mouseX / this._tileWidth);
    this._lastDragY = Math.floor(this.mouseY / this._tileWidth);
    this.canvasElement.addEventListener("mouseup", this.mouseUpHandler.bind(this));
    // $(this.canvasID).on("mouseup", this.mouseUpHandler);
    e.preventDefault();
  },
  mouseMoveHandler(e) {
    const coords = this.getRelativeCoordinates(e);
    this.mouseX = coords.x;
    this.mouseY = coords.y;

    if (this._dragging) {
      // XXX Work up how to patch up the path for fast mouse moves. My first attempt was too slow, and ended up missing
      // mouseUp events
      const x = Math.floor(this.mouseX / this._tileWidth);
      const y = Math.floor(this.mouseY / this._tileWidth);

      const lastX = this._lastDragX;
      const lastY = this._lastDragY;
      if (x !== lastX || y !== lastY) {
        this._emitEvent(Messages.TOOL_CLICKED, {
          x: this.mouseX,
          y: this.mouseY,
        });
        this._lastDragX = x;
        this._lastDragY = y;
      }
    }
  },
  canvasClickHandler(e) {
    e.stopPropagation();

    if (e.which !== 1 || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || this.mouseX === -1 || this.mouseY === -1 || this._dragging) {
      return;
    }

    this._emitEvent(Messages.TOOL_CLICKED, { x: this.mouseX, y: this.mouseY });
    e.preventDefault();
  },
  mouseLeaveHandler(e) {
    this.canvasElement.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvasElement.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvasElement.removeEventListener("mouseup", this.mouseUpHandler);
    // Watch out: we might have been mid-drag
    if (this._dragging) {
      this._dragging = false;
      this._lastDragX = -1;
      this._lastDragY = -1;
    }
    this.canvasElement.removeEventListener("click", this.canvasClickHandler);

    this.mouseX = -1;
    this.mouseY = -1;
  },
  toolButtonHandler(tool: iToolProps) {
    this.toolName = tool.name;
    this.toolWidth = tool.width;
    this.currentTool = this.gameTools[this.toolName];
    this.toolColour = tool.color;
    const toolItem = document.querySelector(this.toolOutputID);
    if (toolItem) {
      toolItem.innerHTML = "Tools";
    }
    if (this.toolName !== "query") {
      this.canvasElement.classList.remove("helpPointer");
      this.canvasElement.classList.add("pointer");
    } else {
      this.canvasElement.classList.remove("pointer");
      this.canvasElement.classList.add("helpPointer");
    }
    // e.preventDefault();
  },
  budgetHandler() {
    modalStore().setOpenBudget(true);
    // setTimeout(() => {
    //   this.makeHandler("BUDGET_REQUESTED");
    // }, 30);
  },
  evalHandler() {
    modalStore().setOpenEvaluation(true);
    // this.makeHandler("EVAL_REQUESTED");
  },
  // queryHandler() {
  //   modalStore().setOpenQuery(true);
  // },
  disasterHandler() {
    // this.makeHandler("DISASTER_REQUESTED");
    modalStore().setOpenDisaster(true);
  },
  screenshotHandler() {
    modalStore().setOpenScreenShot(true);
    //this.makeHandler("SCREENSHOT_WINDOW_REQUESTED");
  },
  speedChangeHandler(value: string) {
    // const requestedSpeed = value
    // const newRequest = requestedSpeed === "Pause" ? "Play" : "Pause";
    // document.querySelector("#pauseRequest").innerHTML = newRequest;[]

    this._emitEvent(Messages.SPEED_CHANGE, value);
  },
  settingsHandler() {
    modalStore().setOpenSettings(true);
    //this.makeHandler("SETTINGS_WINDOW_REQUESTED");
  },
  saveHandler() {
    this.makeHandler("SAVE_REQUESTED");
  },
  debugHandler() {
    this.makeHandler("DEBUG_WINDOW_REQUESTED");
  },
  makeHandler(message: string) {
    let m = Messages[message];
    return (() => {
      this._emitEvent(m);
    })();
  },
  getRelativeCoordinates(e: MouseEvent) {
    const cRect = document.getElementById(this.canvasID).getBoundingClientRect();

    return { x: e.clientX - cRect.left, y: e.clientY - cRect.top };
  },
  clearTool() {
    if (this.toolName === "query") {
      this.canvasElement.classList.remove("helpPointer");
      this.canvasElement.classList.add("pointer");
    }

    this.currentTool = null;
    this.toolWidth = 0;
    this.toolColour = "";
    const element = document.querySelector(".selected");
    if (element) {
      element.classList.remove("selected");
    }
  },
  _emitEvent(event: string, subject?: Object) {
    //todo eventEmitter

    return;
  },
};
