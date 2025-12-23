<script setup lang="ts">
import { onMounted, ref } from "vue";
import { webCityController } from "../game/webcity";
import { splashScreenController } from "../game/splashScreen-ts";
import PlayForm from "./PlayForm.vue";
import { storageController } from "../game/utils/storage-ts";

const openForm = ref(false);
const saved = ref(false);
const loaded = ref(false);
const emit = defineEmits(["update"]);
const choseMap = () => {
  openForm.value = true;
};
const load = () => {
  emit("update");

  loaded.value = true;
  setTimeout(() => {
    splashScreenController.handleLoad();
  }, 50);
};
onMounted(() => {
  webCityController.init();
  const local = storageController.getSavedGame();

  if (local) {
    saved.value = storageController.getSavedGame().isSavedGame;
  }
});
</script>
<template>
  <div class="hidden" id="opaque"></div>
  <div id="loadingBanner" class="loading shadow">
    <h2>Loading...</h2>
  </div>
  <div v-if="!openForm && !loaded" id="splash" class="shadow splash_container awaitGeneration">
    <h2 class="title">Welcome!</h2>
    <p>WebCity is a handmade Javascript port of the open-source city simulator <cite>WebCity</cite></p>
    <div class="content_splash">
      <div id="splashContainer"></div>

      <div id="splashButtons" class="splash_btns">
        <button id="splashLoad" :disabled="!saved" @click="load">Load game</button>
        <button id="splashPlay" @click="choseMap">Play this map</button>
        <button id="splashGenerate" @click="splashScreenController.regenerateMap()">Generate another</button>
      </div>
    </div>
  </div>
  <PlayForm @update="$emit('update')" v-if="openForm && !loaded" />
</template>
<style scoped>
.loading {
  padding: 12px;
  background-color: var(--color-gray-100);
  padding: 12px;
  width: 100%;
  max-width: 212px;
  border-radius: 12px;
  text-align: center;
}
.loading h2 {
  font-size: 1rem;
}
.splash_container {
  background-color: var(--color-gray-100);
  padding: 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 90%;
  max-width: 700px;
}
.title {
  text-align: center;
}
.awaitGeneration {
  display: none;
}
.content_splash {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  flex-wrap: wrap;
  background-color: var(--color-gray-200);
}
.splash_btns {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.splash_btns button {
  width: 100%;
}
.splash_btns button:hover {
  transform: scale(1.015);
  transition: all 0.5s ease;
}
#splashPlay {
  background-color: var(--color-success);
}

#splashGenerate {
  background-color: var(--color-info);
}

@media (max-width: 662px) {
  .content_splash {
    justify-content: center;
  }
}
</style>
<style>
#SplashCanvas {
  max-width: 100%;
}
</style>