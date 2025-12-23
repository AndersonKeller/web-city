<script lang="ts" setup>
import { ref } from "vue";
import { splashScreenController } from "../game/splashScreen-ts";
const emit = defineEmits(["update"]);
const checked = ref(true);
const initial = ref(false);
const gameData = ref({ name: "", dificulty: 0 });
const playGame = () => {
  emit("update");
  setTimeout(() => {
    const game = splashScreenController.play(gameData.value);

    if (game) {
      initial.value = true;
    }
  }, 50);
};
</script>
<template>
  <div v-if="!initial" class="play_container shadow">
    <h2 class="chunk">New Game</h2>
    <form id="playForm" @submit.prevent="playGame">
      <div class="content_form">
        <label for="nameForm">City name (max 15 letters)</label>
        <input id="nameForm" v-model="gameData.name" autofocus required type="text" maxlength="15" />
      </div>
      <div class="content_form">
        <p>Difficulty</p>
        <div class="check">
          <input
            type="radio"
            v-model.number="gameData.dificulty"
            class="difficulty"
            name="difficulty"
            id="difficultyEasy"
            :value="0"
            :checked="checked" /><label for="difficultyEasy">Easy</label>
        </div>
        <div class="check">
          <input type="radio" v-model.number="gameData.dificulty" class="difficulty" name="difficulty" id="difficultyMed" :value="1" /><label
            for="difficultyMed"
            >Medium</label
          >
        </div>
        <div class="check">
          <input type="radio" v-model.number="gameData.dificulty" class="difficulty" name="difficulty" id="difficultyHard" :value="2" /><label
            for="difficultyHard"
            >Hard</label
          >
        </div>
      </div>

      <button id="playit" class="play_btn" type="submit" value="Play!">Play!</button>
    </form>
  </div>
</template>
<style scoped>
.play_container {
  background-color: var(--color-gray-100);
  border-radius: 12px;
  padding: 24px;
}
.play_container form {
  display: flex;
  flex-direction: column;
}
.play_container .content_form {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  gap: 6px;
}
.content_form .check {
  display: flex;
  align-items: center;
  gap: 12px;
}
input {
  height: 32px;
  padding-left: 8px;
  border-radius: 6px;
  outline: none;
}
.play_btn {
  background-color: var(--color-success);
  /* color: var(--color-gray-100); */
}
</style>