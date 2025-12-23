<script setup lang="ts">
import { ref } from "vue";
import { inputStatusController, type iToolProps } from "../../game/inputStatus-ts";
import Iconify from "../Iconify.vue";
import MiscButtons from "./MiscButtons.vue";
interface iTool extends iToolProps {
  icon: string;
  iconcolor?: string;
}
const activeTool = ref({} as iTool);
const tools: iTool[] = [
  { color: "lime", name: "residential", width: 3, icon: "noto:house" },
  { color: "mistyrose", name: "nuclear", width: 4, icon: "openmoji:nuclear-power-plant" },
  { color: "blue", name: "commercial", width: 3, icon: "ion:business" },
  { color: "gray", name: "coal", width: 4, icon: "emojione:factory" },
  { color: "yellow", name: "industrial", width: 3, icon: "mdi:industrial", iconcolor: "#000" },
  { color: "darkblue", width: 3, name: "police", icon: "mdi:police-badge-outline" },
  { color: "#5d5d5d", width: 1, name: "road", icon: "healthicons:paved-road-alt-outline-24px" },
  { color: "#ce9898", width: 3, name: "fire", icon: "noto:fire-extinguisher" },
  { color: "brown", width: 1, name: "rail", icon: "game-icons:railway" },
  { color: "dodgerblue", width: 4, name: "port", icon: "foundation:anchor" },
  { color: "khaki", width: 1, name: "wire", icon: "roentgen:power-pole-2-level", iconcolor: "#000" },
  { color: "indigo", width: 4, name: "stadium", icon: "icon-park-outline:helmet" },
  { color: "salmon", width: 1, name: "bulldozer", icon: "temaki:bulldozer" },
  { color: "violet", width: 6, name: "airport", icon: "map:airport" },
  { color: "cyan", width: 1, name: "query", icon: "streamline-color:search-visual" },
  { color: "darkgreen", width: 1, name: "park", icon: "ph:park-bold" },
];

const handleTool = (item: iTool) => {
  activeTool.value = item;

  inputStatusController.toolButtonHandler(activeTool.value);
};
</script>
<template>
  <div id="controls" class="controlShadow mintcream z1">
    <div id="toolInfo">
      <span class="name">{{ activeTool.name ?? "Tools" }}</span>
      <p class="price" v-if="activeTool.name">$ {{ inputStatusController.currentTool.toolCost.value }}</p>
      <p class="price" v-else></p>
    </div>
    <div id="buttons">
      <button
        :style="{ backgroundColor: item.color }"
        :class="['toolButton', activeTool.name === item.name ? 'selected' : 'unselected']"
        v-for="item in tools"
        @click.stop="handleTool(item)">
        <Iconify :color="item.iconcolor" :icon="item.icon" />
      </button>
    </div>
    <hr />
    <MiscButtons />
  </div>
</template>
<style scoped>
.name {
  text-transform: capitalize;
}
#toolInfo {
  text-align: center;
}
.price {
  height: 20px;
}
#controls {
  position: absolute;
  top: 40px;
  /* width: 305px;
  height: 220px; */
  left: 50px;
  display: flex;
  flex-direction: column;
  width: max-content;
  border-radius: 12px;
  padding: 12px 0;
}
#buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  flex-wrap: wrap;
  width: 92px;
}
#buttons > div {
  display: flex;
  align-items: center;
  gap: 4px;
}
.toolButton {
  color: black;
  background-color: white;
  font-size: 12px;
  padding: 4px;
  z-index: 90;
  position: relative;
}
.selected {
  font-weight: bold;
  /* border: 1px solid black; */
  transform: scale(1.025);
  transition: all 0.3s ease;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.75);
}
.controlShadow {
  -ms-box-shadow: 10px 0px 35px 0px rgba(31, 28, 31, 0.8);
  -webkit-box-shadow: 10px 0px 35px 0px rgba(31, 28, 31, 0.8);
  -moz-box-shadow: 10px 0px 35px 0px rgba(31, 28, 31, 0.8);
  box-shadow: 10px 0px 35px 0px rgba(31, 28, 31, 0.8);
}
@media (max-height: 642px) {
  .controlShadow {
    -ms-box-shadow: unset;
    -webkit-box-shadow: unset;
    -moz-box-shadow: unset;
    box-shadow: unset;
  }
}
</style>