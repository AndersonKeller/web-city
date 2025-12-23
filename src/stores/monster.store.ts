import { defineStore } from "pinia";

import type { iAnimationManager } from "../game/manager/animationManager-ts";
import type { GameMap } from "../game/map/gameMap-ts";
import type { iTyleSet } from "../game/tiles/tileSet-ts";

export const monsterStore = defineStore("monsterStore", {
  state: () => {
    return {
      openTv: false,
      data: {
        gameMap: null as any,
        tileSet: null as iTyleSet,
        spriteSheet: null as HTMLImageElement,
        animationManager: null as any,
      },
    };
  },
  getters: {
    getOpenTv: (state) => state.openTv,
    getData: (state) => state.data,
  },
  actions: {
    setOpenTv(value: boolean) {
      this.openTv = value;
    },
    setData(value: { gameMap: GameMap; tileSet: iTyleSet; spriteSheet: HTMLImageElement; animationManager: iAnimationManager }) {
      this.data = value;
    },
  },
});