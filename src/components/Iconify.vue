<script setup lang="ts">
import { Icon } from "@iconify/vue";
defineProps({
  icon: { required: true, type: String },
  color: { required: false, default: "#eee", type: String },
  width: { required: false, type: String, default: "24" },
  heigth: { required: false, type: String, default: "24" },
});
</script>
<template>
  <Icon :icon="icon" :color="color" :width="width" :height="heigth" />
</template>
<style scoped></style>