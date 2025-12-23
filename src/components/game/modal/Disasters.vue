<script setup lang="ts">
import { ref } from "vue";
import { simulationController } from "../../../game/simulation/simulation-ts";
import { modalStore } from "../../../stores/modal.store";

enum iDisasterOptions {
  "None" = "None",
  // "Monster" = "Monster",
  "Fire" = "Fire",
  "Flood" = "Flood",
  "Crash" = "Crash",
  "Meltdown" = "Meltdown",
  "Tornado" = "Tornado",
}

const selected = ref(iDisasterOptions.None as iDisasterOptions);
const close = () => {
  modalStore().closeAll();
};
interface iOptions {
  key: iDisasterOptions;
  call: () => void;
}
const options: iOptions[] = [
  {
    key: iDisasterOptions.Fire,
    call: () => simulationController.disasterManager.makeFire(),
  },
  {
    key: iDisasterOptions.Flood,
    call: () => simulationController.disasterManager.makeFlood(),
  },
  {
    key: iDisasterOptions.Crash,
    call: () => simulationController.disasterManager.makeCrash(),
  },
  {
    key: iDisasterOptions.Meltdown,
    call: () => simulationController.disasterManager.makeMeltdown(),
  },
  {
    key: iDisasterOptions.Tornado,
    call: () => simulationController.spriteManager.makeTornado(),
  },
  // {
  //   key: iDisasterOptions.Monster,
  //   call: () => simulationController.spriteManager.makeMonster(),
  // },
];

const makeDisaster = () => {
  if (selected.value != iDisasterOptions.None) {
    const findOption = options.find((item) => item.key === selected.value);
    if (findOption) {
      findOption.call();
    }
  }
  close();
};
</script>
<template>
  <div class="modal shadow">
    <header class="header_disaster">
      <h2>Disasters</h2>
    </header>

    <form @submit.prevent="makeDisaster">
      <div class="content">
        <label for="disasterSelect">What disaster do you want to befall this unsuspecting world?</label>
        <select id="disasterSelect" v-model="selected">
          <option v-for="disaster in Object.keys(iDisasterOptions)" :value="disaster">{{ disaster }}</option>
        </select>
      </div>
      <div class="btns">
        <button @click="close" class="cancel">Cancel</button>
        <button type="submit">OK</button>
      </div>
    </form>
  </div>
</template>
<style scoped>
.header_disaster {
  background-color: var(--color-danger);
}
.content {
  padding: 24px 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.content select {
  padding-left: 8px;
  height: 45px;
  border-radius: 10px;
  width: 100%;
  max-width: 220px;
  outline: none;
  box-shadow: 4px 2px 6px var(--color-gray-500) inset;
}
.content select option {
  /* background-color: var(--color-gray-100); */
  font-family: var(--font-family-sour);
}
.btns {
  display: flex;
  width: 80%;
  justify-content: center;
  gap: 24px;
  align-items: center;
  margin: 0 auto;
  padding: 24px 0;
}
.btns button {
  width: 100%;
  color: var(--color-white);
  background-color: var(--color-success);
}
.btns .cancel {
  background-color: var(--color-danger);
}
</style>