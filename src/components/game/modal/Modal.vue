<script setup lang="ts">
import { modalStore } from "../../../stores/modal.store";
import Budget from "./Budget.vue";
import Congrats from "./Congrats.vue";
import Disasters from "./Disasters.vue";
import Evaluation from "./Evaluation.vue";
import Query from "./Query.vue";
import Save from "./Save.vue";
import Settings from "./Settings.vue";
import Debug from "./Debug.vue";
import NagWindow from "./NagWindow.vue";
import ScreenShot from "./ScreenShot.vue";
import TouchWarn from "./TouchWarn.vue";
</script>
<template>
  <div class="wrapper_modal" v-if="modalStore().getOpenGeneric">
    <div class="modal">
      <Congrats v-if="modalStore().getOpenCongrats" />
      <Save v-if="modalStore().getOpenSave" />
      <Budget v-if="modalStore().getOpenBudget" />
      <Evaluation v-if="modalStore().getOpenEvaluation" />
      <Settings v-if="modalStore().getOpenSettings" />
      <Disasters v-if="modalStore().getOpenDisaster" />
      <Query v-if="modalStore().getOpenQuery" />
      <Debug v-if="modalStore().getOpenDebug" />
      <NagWindow v-if="modalStore().getOpenNagWindow" />
      <ScreenShot v-if="modalStore().getOpenScreenShot" />
      <TouchWarn v-if="modalStore().getOpenTouchWarn" />
    </div>
  </div>
</template>
<style scoped>
.wrapper_modal {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;
  background-color: rgba(96, 96, 96, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.modal {
  border: 1px solid black;
  /* padding: 16px; */
  border-radius: 12px;
  overflow: hidden;
  z-index: 20;
  background-color: var(--color-gray-100);
  width: 100%;
  max-width: 542px;
}
</style>
<style>
.modal header {
  background-color: var(--color-info);
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal header h2 {
  color: var(--color-white);
  font-size: 1.25rem;
}
</style>