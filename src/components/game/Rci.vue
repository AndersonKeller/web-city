<script setup lang="ts"></script>
<template>
  <div id="RCIContainer"></div>
</template>
<style scoped>
#RCIContainer {
  position: absolute;
  top: 58px;
  right: 42px;
  width: 120px;
  height: 115px;
  margin: 0px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-shadow: 10px 0px 35px 0px rgba(31, 28, 31, 0.8);
  background-color: var(--color-white);
  z-index: 10;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
@media (max-height: 702px) {
  #RCIContainer {
    top: 442px;
  }
}
@media (max-height: 612px) {
  #RCIContainer {
    top: 352px;
  }
}
@media (max-height: 672px) {
  #RCIContainer {
    top: 412px;
  }
}
</style>