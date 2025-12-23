<script setup lang="ts">
import { simulationController } from "../../../game/simulation/simulation-ts";
import { modalStore } from "../../../stores/modal.store";

const addMoney = () => {
  simulationController.budget.spend(-20000);
  modalStore().closeAll();
};
</script>
<template>
  <div class="modal shadow">
    <header class="debug_header">
      <h2>Debug</h2>
    </header>

    <form @submit.prevent="addMoney">
      <h3>Add funds?</h3>
      <p>You add $ 20000 a your funds</p>

      <div class="btns">
        <button @click="modalStore().closeAll()" type="button" class="cancel">Cancel</button>
        <button type="submit">OK</button>
      </div>
    </form>
  </div>
</template>
<style scoped>
.debug_header {
  background-color: var(--color-warning);
}
form {
  display: flex;
  padding: 24px;
  justify-items: center;
  align-items: center;
  flex-direction: column;
  gap: 24px;
}
form .btns {
  display: flex;
  width: 100%;
  gap: 24px;
  align-items: center;
  justify-content: center;
}
form .btns button {
  width: 100%;
  max-width: 180px;
  background-color: var(--color-success);
  color: var(--color-white);
}
form .btns .cancel {
  background-color: var(--color-danger);
}
</style>