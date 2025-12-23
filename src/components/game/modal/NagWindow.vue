<script setup lang="ts">
import { modalStore } from "../../../stores/modal.store";
</script>
<template>
  <div class="modal shadow">
    <header class="nag_header">
      <h2>WebCity</h2>
    </header>
    <div class="body">
      <div class="content">
        <p>
          - Wow! You've been playing this for half an hour?!? That's when I can ask you to star the repository on github.
          <a href="https://github.com/AndersonKeller/web-city" target="_blank">WebCity</a>
        </p>
      </div>
      <button class="btn" @click="modalStore().closeAll()">Ok</button>
    </div>
  </div>
</template>
<style scoped>
.body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
  align-items: center;
}

.btn {
  background-color: var(--color-success);
  color: var(--color-gray-100);
}
</style>