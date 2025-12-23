<script setup lang="ts">
import { ref, watch } from "vue";
import { monsterStore } from "../../stores/monster.store";

import { monsterCanvasController } from "../../game/canvas/monsterCanvas";

const canvas = ref(null as typeof monsterCanvasController);
watch(
  () => monsterStore().getOpenTv,
  () => {
    if (monsterStore().getOpenTv) {
      setTimeout(() => {
        canvas.value = monsterCanvasController.create("tvCanvas", "tvContainer");

        const { animationManager, gameMap, spriteSheet, tileSet } = monsterStore().getData;
        setTimeout(() => {
          canvas.value.init(gameMap, tileSet, spriteSheet, animationManager);
          // canvas.disallowOffMap();
          // const origin = canvas.getTileOrigin();
          //const spriteList: any = simulationController.spriteManager.getSpritesInView(origin.x, origin.y, canvas.canvasWidth, canvas.canvasHeight);
          // canvas.paint(null, spriteList);
          // const { x, y, sprite } = notificationStore().getData;
          // canvas.value.track(x, y, sprite);
        }, 300);
      }, 300);
    }
  },
);
</script>
<template>
  <div v-if="monsterStore().getOpenTv" id="monstertv" class="alignCenter z1 rightedge padding10 controlShadow open">
    <div id="monsterTVContainer">
      <div id="tvContainer"></div>

      <button @click="monsterStore().setOpenTv(false)" class="cancel">Close</button>
    </div>
  </div>
</template>
<style scoped>
canvas {
  width: 100%;
}
#monstertv {
  position: absolute;
  bottom: 262px;
  width: 200px;
  right: 42px;
  background-color: var(--color-gray-100);
  border-radius: 12px;
}
</style>