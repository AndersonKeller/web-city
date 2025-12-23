<script setup lang="ts">
import { modalStore } from "../../../stores/modal.store";
</script>
<template>
  <div class="modal shadow">
    <header class="touch_header">
      <h2>Hello, touchscreen user!</h2>
    </header>
    <div class="touch_content">
      <h2>Hi!</h2>
      <p>It seems you're using a touchscreen device!</p>
      <p>Just to warn you, webCity isn't really geared towards touch devices&mdash;I don't own a tablet&mdash;so you might be in for a bad time.</p>
      <p>However, if you're wanting to give it a shot, I won't stop you!</p>
      <button class="danger" @click="modalStore().closeAll()">OK</button>
    </div>
  </div>
</template>
<style scoped>
.touch_content {
  display: flex;
  gap: 12px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.danger {
  background-color: var(--color-danger);
  color: var(--color-white);
  width: 100%;
  max-width: 212px;
  margin: 0 auto;
}
</style>