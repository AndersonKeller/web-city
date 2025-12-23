<script setup lang="ts">
import { modalStore } from "../../../stores/modal.store";
</script>
<template>
  <div class="content">
    <div class="header">
      <h2>Congratulations!</h2>
    </div>
    <div class="body">
      <h2>{{ modalStore().getMessage }}</h2>
      <button @click="modalStore().closeAll()">OK</button>
    </div>
  </div>
</template>
<style scoped>
.content {
  display: flex;
  flex-direction: column;

  justify-content: center;
  align-items: center;
}
.content .header {
  text-align: center;
  background-color: var(--color-success);
  color: var(--color-gray-100);
}
.content .header,
.content .body {
  padding: 16px;
  width: 100%;
}
.content .body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.header h2,
.body h2 {
  font-size: 1.25rem;
}
.content .body button {
  background-color: var(--color-success);
  color: var(--color-gray-100);
}
</style>