<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { modalStore } from "../../../stores/modal.store";
import { simulationController } from "../../../game/simulation/simulation-ts";
import { textUtils } from "../../../game/utils/text-ts";
interface iStaticItem {
  text: string;
  value: string | number;
}
const evaluation = ref(simulationController.evaluation);
onMounted(() => {
  evaluation.value = simulationController.evaluation;
});
watch(
  () => modalStore().getOpenEvaluation,
  () => {
    evaluation.value = simulationController.evaluation;
  },
);
const staticsItems: iStaticItem[] = [
  {
    text: "Population:",
    value: evaluation.value.cityPop,
  },
  {
    text: "Net Migration:",
    value: evaluation.value.cityPopDelta,
  },
  { text: "Assessed Value:", value: evaluation.value.cityAssessedValue },
  { text: "Category:", value: textUtils.cityClass[evaluation.value.cityClass] },
  { text: "Game Level:", value: textUtils.gameLevel[evaluation.value.gameLevel] },
  { text: "Score:", value: evaluation.value.cityScore },
  { text: "Annual change:", value: evaluation.value.cityScoreDelta },
];
</script>
<template>
  <div v-if="modalStore().getOpenEvaluation" class="modal shadow">
    <header id="evalHeader" class="evaluation_header">
      <h2>Evaluation</h2>
    </header>
    <div class="content">
      <h2>Public opinion</h2>
      <section class="opinion">
        <div class="approve">
          <p>Is the mayor doing a good job?</p>
          <div class="infos">
            <p>
              YES: <span>{{ evaluation.cityYes }}%</span>
            </p>
            <p>
              NO: <span>{{ 100 - evaluation.cityYes }}%</span>
            </p>
          </div>
        </div>
        <div class="problems">
          <p>What are the worst problems?</p>
          <ul class="problem_list">
            <li v-for="item in 4" id="evalProb1">
              {{ textUtils.problems[item] }}
            </li>
          </ul>
        </div>
      </section>
      <section class="section_statics">
        <h2>Statistics</h2>
        <ul>
          <li v-for="item in staticsItems">
            <p>{{ item.text }}</p>
            <p>{{ item.value }}</p>
          </li>
        </ul>
      </section>

      <button @click="modalStore().setOpenEvaluation(false)">OK</button>
    </div>
  </div>
</template>
<style scoped>
.evaluation_header {
  background-color: var(--color-success);
}
.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
}
.opinion {
  display: flex;
  justify-content: space-evenly;
  width: 100%;
  padding: 12px 0;
}
.opinion p,
.opinion li {
  font-size: 1rem;
}
.opinion .infos p {
  font-weight: 600;
  font-style: italic;
  font-size: 1.25rem;
}
.approve,
.problems {
  background-color: var(--color-white);
  box-shadow: 0 0 6px var(--color-gray-300);
  border-radius: 10px;
  padding: 8px 12px;
}
.approve p,
.problems p {
  font-weight: 500;
}
.opinion li {
  font-style: italic;
  text-decoration: underline;
}
.opinion .infos {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 24px 0;
}
.content h2 {
  font-size: 1.25rem;
}
.opinion .infos p:first-child {
  color: var(--color-success);
}
.opinion .infos p:last-child {
  color: var(--color-danger);
}
.problem_list {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.section_statics {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  align-items: center;
  margin-bottom: 16px;
}
.section_statics ul {
  display: flex;
  flex-direction: column;
  width: 60%;
  margin: 0 auto;
  gap: 4px;
}
.section_statics ul li {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 4px;
  border-radius: 6px;
  background-color: var(--color-white);
  box-shadow: 0 0 6px var(--color-gray-300);
}
ul li p {
  font-weight: 500;
}
.content button {
  background-color: var(--color-success);
  color: var(--color-white);
  width: 100%;
  max-width: 210px;
}
</style>