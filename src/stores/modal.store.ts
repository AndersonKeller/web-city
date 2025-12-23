import { defineStore } from "pinia";
import type { BlockMapSimulation } from "../game/simulation/simulation-ts";

export const modalStore = defineStore("modalStore", {
  state: () => {
    return {
      openEvaluation: false,
      openBudget: false,
      openCongrats: false,
      message: "",
      openGeneric: false,
      openSave: false,
      openSettings: false,
      openDisaster: false,
      openQuery: false,
      openDebug: false,
      openTouchWarn: false,
      openNagWindow: false,
      openScreenShot: false,
      queryPos: {
        x: 0,
        y: 0,
        blockmaps: null as any,
      },
    };
  },
  getters: {
    getOpenTouchWarn: (state) => state.openTouchWarn,
    getOpenScreenShot: (state) => state.openScreenShot,
    getOpenNagWindow: (state) => state.openNagWindow,
    getOpenDebug: (state) => state.openDebug,
    getOpenQuery: (state) => state.openQuery,
    getOpenDisaster: (state) => state.openDisaster,
    getOpenSettings: (state) => state.openSettings,
    getOpenCongrats: (state) => state.openCongrats,
    getOpenEvaluation: (state) => state.openEvaluation,
    getOpenBudget: (state) => state.openBudget,
    getMessage: (state) => state.message,
    getOpenGeneric: (state) => state.openGeneric,
    getOpenSave: (state) => state.openSave,
  },
  actions: {
    setOpenDebug(value: boolean) {
      this.openGeneric = value;
      this.openDebug = value;
    },
    setOpenTouchWarn(value: boolean) {
      this.openGeneric = value;
      this.openTouchWarn = value;
    },
    setOpenNagWindow(value: boolean) {
      this.openGeneric = value;
      this.openNagWindow = value;
    },
    setOpenScreenShot(value: boolean) {
      this.openGeneric = value;
      this.openScreenShot = value;
    },
    setOpenQuery(value: boolean, x: number, y: number, blockMaps: BlockMapSimulation) {
      this.openGeneric = value;
      this.openQuery = value;
      this.queryPos.x = x;
      this.queryPos.y = y;
      this.queryPos.blockmaps = blockMaps;
    },
    setOpenDisaster(value: boolean) {
      this.openGeneric = value;
      this.openDisaster = value;
    },
    setopenGeneric(value: boolean) {
      this.closeAll();
      this.openGeneric = value;
    },
    closeAll() {
      this.openBudget = false;
      this.openEvaluation = false;
      this.openCongrats = false;
      this.openGeneric = false;
      this.openSave = false;
      this.openSettings = false;
      this.openDisaster = false;
      this.openQuery = false;
      this.openDebug = false;
      this.openNagWindow = false;
      this.openScreenShot = false;
      this.openTouchWarn = false;
    },
    setOpenCongrats(value: boolean, message: string) {
      this.setopenGeneric(value);
      this.setMessage(message);
      this.openCongrats = value;
    },
    setOpenEvaluation(value: boolean) {
      // this.closeAll();
      this.openGeneric = value;
      this.openEvaluation = value;
    },
    setOpenBudget(value: boolean) {
      // this.closeAll();
      this.openGeneric = value;
      this.openBudget = value;
    },
    setOpenSave(value: boolean, message: string) {
      this.setopenGeneric(value);
      this.openSave = value;
      this.setMessage(message);
    },
    setOpenSettings(value: boolean) {
      this.closeAll();
      this.setopenGeneric(value);
      this.openSettings = value;
    },
    setMessage(value: string) {
      this.message = value;
    },
  },
});