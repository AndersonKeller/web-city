<script setup lang="ts">
import { simulationStore } from "../../stores/simulation.store";
</script>
<template>
  <div class="info_bar">
    <div class="inner">
      <p id="name" class="name">{{ simulationStore().getName }}</p>

      <p id="date">{{ simulationStore().getDate }}</p>

      <p>
        Funds $<span id="funds">{{ simulationStore().getFund }}</span>
      </p>
      <p>
        Score: <span id="score">{{ simulationStore().getScore }}</span>
      </p>

      <p id="cclass">{{ simulationStore().getClassification }}</p>
      <p>
        Population:
        <span id="population">{{ simulationStore().getPopulation }}</span>
      </p>

      <!-- <span>{{ simulationStore().getFund }}</span> -->
    </div>
  </div>
</template>
<style scoped>
.name {
  text-transform: capitalize;
}
.info_bar {
  position: absolute;
  top: 41px;
  z-index: 10;
  background-color: var(--color-gray-100);
  left: 0;
  width: 100%;
  animation: open 1s ease;
}
.info_bar .inner {
  display: flex;
  padding: 12px 4%;
  gap: 28px;
}
.inner p {
  border-bottom: 1px solid var(--color-gray-300);
  font-weight: 800;
  font-size: 0.875rem;
  font-family: var(--font-family);
  min-width: max-content;
}
@keyframes open {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>