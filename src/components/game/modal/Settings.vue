<script setup lang="ts">
import { ref } from "vue";

import { simulationController } from "../../../game/simulation/simulation-ts";
import { modalStore } from "../../../stores/modal.store";
import { baseToolController } from "../../../game/tools/baseTool-ts";

const data = ref({
  autoBudget: simulationController.budget.autoBudget,
  autoBulldoze: baseToolController.getAutoBulldoze(),
  disasters: simulationController.disasterManager.disastersEnabled,
});

const submit = () => {
  simulationController.budget.setAutoBudget(data.value.autoBudget);
  baseToolController.setAutoBulldoze(data.value.autoBulldoze);

  simulationController.disasterManager.disastersEnabled = data.value.disasters;
  modalStore().closeAll();
};
</script>
<template>
  <div class="shadow modal">
    <header class="header_settings">
      <h2>Settings</h2>
    </header>
    <div class="settings_container">
      <form @submit.prevent="submit">
        <div class="data_content">
          <div>
            <p>Autobudget:</p>
            <fieldset>
              <input v-model="data.autoBudget" type="radio" name="autoBudgetSetting" :value="true" />
              <label for="autoBudgetYes">Yes</label>
            </fieldset>
            <fieldset>
              <input v-model="data.autoBudget" type="radio" name="autoBudgetSetting" :value="false" /><label for="autoBudgetNo">No</label>
            </fieldset>
          </div>
          <div>
            <p>Autobulldoze:</p>
            <fieldset>
              <input v-model="data.autoBulldoze" type="radio" name="autoBulldozeSetting" :value="true" /><label for="autoBulldozeYes">Yes</label>
            </fieldset>
            <fieldset>
              <input v-model="data.autoBulldoze" type="radio" name="autoBulldozeSetting" :value="false" /><label for="autoBulldozeNo">No</label>
            </fieldset>
          </div>

          <div>
            <p>Disasters:</p>
            <fieldset>
              <input type="radio" name="disastersSetting" :value="true" v-model="data.disasters" /><label for="disastersYes">Yes</label>
            </fieldset>
            <fieldset>
              <input type="radio" name="disastersSetting" :value="false" v-model="data.disasters" /><label for="disastersNo">No</label>
            </fieldset>
          </div>
        </div>
        <div class="btns">
          <button class="cancel">Cancel</button>
          <button type="submit">OK</button>
        </div>
      </form>
    </div>
  </div>
</template>
<style scoped>
.header_settings {
  background-color: var(--color-danger-100);
}
.data_content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 24px;
  gap: 12px;
}
.data_content > div {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
  width: 50%;

  box-shadow: 3px 6px 6px var(--color-gray-300);
  padding: 4px;
}
.data_content > div fieldset {
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background-color: var(--color-gray-200);
  border-radius: 10px;
}
.data_content fieldset label {
  text-transform: uppercase;
  font-weight: 500;
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
  max-width: 240px;
  font-weight: 600;
  background-color: var(--color-success);
  color: var(--color-white);
}
.btns .cancel {
  background-color: var(--color-danger);
}
</style>