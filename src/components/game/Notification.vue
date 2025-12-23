<script setup lang="ts">
import { ref, watch } from "vue";
import { notificationStore } from "../../stores/notification.store";
import { gameCanvasController } from "../../game/gameCanvas-ts";

const timeout = ref(null);
const seconds = 20;
const toData = () => {
  if (notificationStore().getData) {
    const { x, y } = notificationStore().getData;
    console.log(x, y);
    gameCanvasController.centreOn(x, y);
  }
};
watch(
  () => notificationStore().getNotification.message,
  () => {
    if (notificationStore().getNotification.message) {
      timeout.value = window.setTimeout(() => {
        notificationStore().setMessage("");
      }, seconds * 1000);
    } else {
      window.clearTimeout(timeout.value);
      timeout.value = null;
    }
  },
);
</script>
<template>
  <div
    v-if="notificationStore().getNotification.message"
    @click="toData"
    id="notifications"
    :class="[notificationStore().getNotification.type, notificationStore().getData ? 'cursor' : '']"
    class="neutral">
    <p>{{ notificationStore().getNotification.message }}</p>
  </div>
</template>
<style scoped>
#notifications {
  position: absolute;
  bottom: 65px;

  width: 400px;
  border-radius: 16px;

  padding: 10px 16px;
  box-shadow: 0 4px 6px var(--color-gray-500);
}
#notifications p {
  text-align: center;
}
.neutral {
  background-color: var(--color-gray-100);
}
.good {
  background-color: var(--color-success);
  color: var(--color-gray-500);
}
.bad {
  background-color: var(--color-danger);
  color: var(--color-warning);
}
.cursor {
  cursor: pointer;
}
</style>