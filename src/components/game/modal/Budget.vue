<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { simulationController } from "../../../game/simulation/simulation-ts";
import { modalStore } from "../../../stores/modal.store";

const budget = ref(simulationController.budget);
const data = ref({
  roadRate: Math.floor(budget.value.roadPercent * 100),
  fireRate: Math.floor(budget.value.firePercent * 100),
  policeRate: Math.floor(budget.value.policePercent * 100),
  taxRate: budget.value.cityTax,
  taxesCollected: budget.value.taxFund,
  roadMaintenanceBudget: budget.value.roadMaintenanceBudget,
  fireMaintenanceBudget: budget.value.fireMaintenanceBudget,
  policeMaintenanceBudget: budget.value.policeMaintenanceBudget,
});
const cashflow = ref(0);
const roadCost = ref(0);
const fireCost = ref(0);
const policeCost = ref(0);
onMounted(() => {
  budget.value = simulationController.budget;
  calculate();
});
const calculate = () => {
  roadCost.value = Math.floor(data.value.roadMaintenanceBudget * (data.value.roadRate / 100));
  fireCost.value = Math.floor(data.value.fireMaintenanceBudget * (data.value.fireRate / 100));
  policeCost.value = Math.floor(data.value.policeMaintenanceBudget * (data.value.policeRate / 100));
  cashflow.value = data.value.taxesCollected - roadCost.value - fireCost.value - policeCost.value;
};

watch(
  () => [data.value.roadRate, data.value.fireRate, data.value.policeRate],
  () => {
    calculate();
  },
);
const close = () => {
  simulationController.budget.roadPercent = Number(data.value.roadRate) / 100;
  simulationController.budget.firePercent = Number(data.value.fireRate) / 100;
  simulationController.budget.policePercent = Number(data.value.policeRate) / 100;
  simulationController.budget.setTax(Number(data.value.taxRate) - 0);
  simulationController.budget.updateFundEffects();
  modalStore().closeAll();
  //   modalStore().closeAll();
};
</script>
<template>
  <div v-if="modalStore().getOpenBudget" class="modal shadow">
    <header class="budget_header">
      <h2>Budget</h2>
    </header>
    <div class="content">
      <form @submit.prevent="close">
        <div class="field">
          <p>
            Tax Collected: <span>{{ data.taxesCollected }}</span>
          </p>
          <p>
            Cashflow:
            <span>
              {{ cashflow }}
            </span>
          </p>
        </div>
        <div class="field">
          <p>
            Previous funds: <span> ${{ budget.totalFunds }} </span>
          </p>
          <p>
            Current funds: <span> $ {{ budget.totalFunds + cashflow }} </span>
          </p>
        </div>
        <div class="content_models">
          <fieldset>
            <legend>Roads</legend>
            <input v-model="data.roadRate" type="range" id="roadRate" min="0" max="100" step="1" />

            <label for="roadRate">{{ data.roadRate }}% of ${{ data.roadMaintenanceBudget }} = ${{ roadCost }}</label>
          </fieldset>
          <fieldset>
            <legend>Fire</legend>
            <input v-model="data.fireRate" type="range" id="fireRate" min="0" max="100" step="1" />

            <label for="fireRate"> {{ data.fireRate }} % of ${{ data.fireMaintenanceBudget }} = ${{ fireCost }}</label>
          </fieldset>
          <fieldset>
            <legend>Police</legend>
            <input v-model="data.policeRate" type="range" id="policeRate" min="0" max="100" step="1" />

            <label for="policeRate"> {{ data.policeRate }}% of ${{ data.policeMaintenanceBudget }} = ${{ policeCost }}</label>
          </fieldset>
          <fieldset>
            <legend>Tax</legend>
            <input v-model="data.taxRate" type="range" id="taxRate" min="0" max="20" step="1" />

            <label for="taxRate">Tax rate: {{ data.taxRate }}%</label>
          </fieldset>
        </div>
        <div class="btns">
          <!-- <button type="button" class="reset">Reset</button> -->
          <button @click="modalStore().closeAll()" type="button" class="cancel">Cancel</button>

          <button type="submit" id="budgetOK">OK</button>
        </div>
      </form>
    </div>
  </div>
</template>
<style scoped>
.content {
  padding: 24px;
}
.content p {
  font-weight: 500;
}
.content legend {
  font-weight: 500;
  filter: drop-shadow(0px 0px 2px var(--color-gray-300));
}
.content form .field {
  display: flex;
  justify-content: space-between;
}
.content .content_models {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
}
.content .content_models fieldset {
  width: 45%;
  padding: 12px;
  box-shadow: 0 0 16px var(--color-gray-300);
  border: none;
  border-radius: 10px;
}
.content_models input {
  width: 100%;
}
.btns {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
  padding: 12px;
}
.btns button {
  width: 100%;
  background-color: var(--color-success);
  color: var(--color-white);
}
.btns .cancel {
  background-color: var(--color-danger);
}
.btns .reset {
  background-color: var(--color-info);
}
</style>