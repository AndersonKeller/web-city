<script setup lang="ts">
import InfoBar from "./game/InfoBar.vue";
const props = defineProps({
  start: { type: Boolean, required: true },
});
</script>
<template>
  <header>
    <div class="content">
      <h1 id="title">WebCity</h1>

      <nav>
        <!-- <a href="#" target="_blank">About</a> -->

        <a href="https://github.com/graememcc/micropolisJS" target="_blank">GitHub</a>
      </nav>
    </div>
    <InfoBar v-if="start" />
  </header>
</template>
<style scoped>
header {
  display: flex;
  flex-direction: column;
  padding: 0;
  background-color: var(--color-gray-600);
}
header a {
  color: var(--color-gray-100);
}
header h1 {
  color: var(--color-white);
}
header .content {
  display: flex;
  justify-content: space-between;
  width: 90%;
  margin: 0 auto;
}
header .content nav {
  display: flex;
  gap: 16px;
  align-items: center;
}
</style>