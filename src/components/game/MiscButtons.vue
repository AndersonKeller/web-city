<script setup lang="ts">
import { ref } from "vue";
import { inputStatusController } from "../../game/inputStatus-ts";
import Iconify from "../Iconify.vue";
interface iMiscButtons {
  action: () => void;
  name: string;
  icon: string;
  iconSpeed?: string;
}
const activeMisc = ref({} as iMiscButtons);
const speedValue = ref("Pause");
const budget = () => {
  inputStatusController.budgetHandler();
};
const evalRequest = () => {
  inputStatusController.evalHandler();
};
const disaster = () => {
  inputStatusController.disasterHandler();
};
const speed = () => {
  inputStatusController.speedChangeHandler(speedValue.value);
  if (speedValue.value === "Pause") {
    speedValue.value = "Play";
  } else {
    speedValue.value = "Pause";
  }
};
const screenShot = () => {
  inputStatusController.screenshotHandler();
};
const save = () => {
  inputStatusController.saveHandler();
};
const settings = () => {
  inputStatusController.settingsHandler();
};
const buttons: iMiscButtons[] = [
  {
    action: budget,
    name: "Budget",
    icon: "streamline-ultimate-color:presentation-projector-screen-budget-analytics",
  },
  {
    name: "Evaluation",
    action: evalRequest,
    icon: "hugeicons:chart-evaluation",
  },
  {
    name: "Disasters",
    action: disaster,
    icon: "fa7-solid:spaghetti-monster-flying",
  },
  { action: save, name: "Save", icon: "material-symbols:save-outline" },
  {
    name: "Settings",
    action: settings,
    icon: "fluent-color:wrench-screwdriver-20",
  },
  { name: "Take Picture", action: screenShot, icon: "fontisto:picture" },
  // { name: "Pause", action: speed, icon: "lucide:pause", iconSpeed: "line-md:play-filled" },
];
const handleMisc = (item: iMiscButtons) => {
  activeMisc.value = item;
  item.action();
};
</script>
<template>
  <div id="miscButtons">
    <button v-for="item in buttons" @click="handleMisc(item)" :class="[activeMisc.name === item.name ? 'selected' : '']">
      <Iconify color="#000" :icon="item.iconSpeed && speedValue === 'Play' ? item.iconSpeed : item.icon" />
    </button>
  </div>
</template>
<style scoped>
#miscButtons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  width: 92px;
  gap: 4px;
  padding: 6px 12px;
}
#miscButtons button {
  background-color: var(--color-success);
  padding: 4px;
  z-index: 90;
}
.selected {
  font-weight: bold;
  /* border: 1px solid black; */
  transform: scale(1.025);
  transition: all 0.3s ease;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.75);
}
</style>