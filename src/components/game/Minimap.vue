<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { gameCanvasController } from "../../game/gameCanvas-ts";
import { simulationController } from "../../game/simulation/simulation-ts";
import { splashCanvasController } from "../../game/canvas/splashCanvas-ts";
const map = ref(simulationController._map);
onMounted(() => {
  setTimeout(() => {
    map.value = simulationController._map;
  }, 1000);
});
watch(
  () => map.value,
  () => {
    if (map.value) {
      const canvas: HTMLCanvasElement = document.querySelector("#minimap");
      if (canvas instanceof HTMLCanvasElement) {
        const ctx = canvas.getContext("2d");
        ctx.scale(0.3, 0.25);
        for (let y = 0; y < map.value.height; y++) {
          for (let x = 0; x < map.value.width; x++) {
            splashCanvasController._paintTile(map.value.getTileValue(x, y), x, y, ctx);
          }
        }
      }
    }
  },
);
const toMinimap = (e) => {
  const cRect = document.getElementById("minimap").getBoundingClientRect();

  const move = { x: e.clientX - cRect.left, y: e.clientY - cRect.top };

  gameCanvasController.centreOn(move.x, move.y);
};
</script>
<template>
  <div id="minimapContent" class="alignCenter z1 rightedge padding10 controlShadow open">
    <div id="content">
      <div id="minimapContainer" style="width: 180px; height: 90px">
        <canvas id="minimap" @click="toMinimap"></canvas>
      </div>
    </div>
  </div>
</template>
<style scoped>
canvas {
  width: 100%;
}
#minimapContent {
  position: absolute;
  bottom: 62px;
  width: 200px;
  right: 42px;
  background-color: var(--color-gray-100);
  border-radius: 12px;
}
</style>