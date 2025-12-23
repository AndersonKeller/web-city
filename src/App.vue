<script setup lang="ts">
import { ref } from "vue";
import Menu from "./components/Menu.vue";
import Rci from "./components/game/Rci.vue";

import Controls from "./components/game/Controls.vue";
import Minimap from "./components/game/Minimap.vue";

import Header from "./components/Header.vue";
import Modal from "./components/game/modal/Modal.vue";
import Speed from "./components/game/Speed.vue";
import { Config } from "./game/utils/config-ts";
import { modalStore } from "./stores/modal.store";
import Notification from "./components/game/Notification.vue";

const start = ref(false);
const config = Config;
const openDebug = () => {
  modalStore().setOpenDebug(true);
};
</script>

<template>
  <Header :start="start" />
  <main id="canvasContainer">
    <Menu @update="start = true" />
    <template v-if="start">
      <Speed />
      <Rci />

      <Controls />
      <Minimap />

      <Modal />
      <Notification />
      <div v-if="config.debug" class="debug">
        <div id="fps"><span id="fpsValue">0</span> FPS</div>
        <div>
          <button @click="openDebug" id="debugRequest">Debug</button>
        </div>
      </div>

      <div id="tooSmall" data-hasscript="true" class="mintcream open">
        <div id="tooSmallInner" class="alignCenter padding10">
          <h2 class="chunk">Uh-oh!</h2>
          <p>This screen is too small&mdash;I won't be able to fit in all the controls, buttons and gizmos! Sorry!</p>
        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
main {
  position: absolute;
  top: 82px;
  bottom: 0;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.debug {
  position: absolute;
  top: 512px;
  border-radius: 12px;
  right: 42px;
  background-color: var(--color-white);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
</style>