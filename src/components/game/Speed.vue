<script setup lang="ts">
import { ref } from "vue";
import Iconify from "../Iconify.vue";
import { simulationController } from "../../game/simulation/simulation-ts";
import { inputStatusController } from "../../game/inputStatus-ts";
const speed = ref(simulationController._speed);
const isPaused = ref("Pause");
const pause = () => {
  inputStatusController.speedChangeHandler(isPaused.value);
  if (isPaused.value === "Pause") {
    speed.value = 0;
    isPaused.value = "Play";
  } else {
    speed.value = 1;
    isPaused.value = "Pause";
  }
};

const change = (newSpeed: number) => {
  speed.value = newSpeed;
  inputStatusController.speedChangeHandler("Play");
  simulationController.setSpeed(newSpeed);
  isPaused.value = "Pause";
};
</script>
<template>
  <div class="speed_container controlShadow">
    <button :class="speed === 0 ? 'active' : ''" @click="pause">
      <Iconify icon="lucide:pause" color="#000" />
    </button>
    <button :class="speed === 1 ? 'active' : ''" @click="change(1)">
      1x
      <Iconify icon="line-md:play-filled" color="#000" />
    </button>
    <button :class="speed === 2 ? 'active' : ''" @click="change(2)">
      2x
      <Iconify icon="ri:speed-mini-fill" color="#000" />
    </button>
    <button :class="speed === 3 ? 'active' : ''" @click="change(3)">
      3x
      <Iconify icon="ri:speed-mini-fill" color="#000" />
    </button>
  </div>
</template>
<style scoped>
.speed_container {
  position: absolute;
  background-color: var(--color-gray-200);
  top: 8px;
  right: 42px;

  margin: 0px;
  border-radius: 6px;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 4px;
}
.speed_container button {
  padding: 2px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.speed_container button.active {
  background-color: var(--color-gray-200);
  transform: scale(0.9);
  transition: all 0.3s ease;
  box-shadow: 2px 2px 6px inset;
  /* padding: 4px 10px; */
}
</style>