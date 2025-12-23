<script setup lang="ts">
import { ref } from "vue";
import { modalStore } from "../../../stores/modal.store";
import { gameCanvasController } from "../../../game/gameCanvas-ts";

import { simulationStore } from "../../../stores/simulation.store";
enum iTypePrint {
  "visible" = "visible",
  "all" = "all",
}
const print = ref(iTypePrint.all as iTypePrint);
const takeShot = () => {
  let w: string = "";
  if (print.value === iTypePrint.all) {
    w = gameCanvasController.screenshotMap();
  } else {
    w = gameCanvasController.screenshotVisible();
  }
  const styles = ` * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            }
            img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            }
            `;
  const style = document.createElement("style");
  style.innerHTML = styles;
  const win = window.open("", "");
  const script = document.createElement("script");
  const title = simulationStore().getName + "_" + simulationStore().getDate.replace(" ", "_");
  script.innerHTML = `const a = document.querySelector("#down")
        if(a){
        a.click()
        }`;
  const texto = `
    <a href=${w} download="${title}" id="down"></a>
    <img src=${w}>

  `;
  win.document.writeln(`<html><head>${style.outerHTML}<title>${title}</title>`);
  win.document.writeln("</head><body>");
  win.document.writeln(texto, script.outerHTML);
  win.document.writeln("</body></html>");
  win.focus();

  //   modalStore().closeAll();
};
</script>
<template>
  <div class="modal shadow">
    <header class="screenshot_header">
      <h2>Take Picture</h2>
    </header>

    <form @submit.prevent="takeShot" class="form_sreenshot">
      <div class="content">
        <p>Area to take picture of:</p>
        <div class="fields">
          <fieldset>
            <input type="radio" v-model="print" name="screenshotType" id="screenshotVisible" :value="iTypePrint.visible" :checked="true" />
            <label for="screenshotVisible">Visible Map</label>
          </fieldset>
          <fieldset>
            <input type="radio" v-model="print" name="screenshotType" id="screenshotAll" :value="iTypePrint.all" />
            <label for="screenshotAll">Full map</label>
          </fieldset>
        </div>
      </div>
      <div class="btns">
        <button @click="modalStore().closeAll()" class="cancel">Cancel</button>
        <button type="submit" value="OK">OK</button>
      </div>
    </form>
  </div>
</template>
<style scoped>
.screenshot_header {
  background-color: var(--color-danger);
}
.form_sreenshot {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  padding: 24px;
}
.form_sreenshot .btns {
  display: flex;
  gap: 16px;
  width: 100%;
  align-items: center;
  justify-content: center;
}
.form_sreenshot .content {
  display: flex;
  gap: 16px;
  flex-direction: column;
  align-items: center;
}
.content p {
  font-weight: 500;
  font-size: 1.25rem;
}
.content .fields {
  display: flex;
  gap: 24px;
}
.content .fields fieldset {
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 0 6px var(--color-gray-300);
  padding: 6px 12px;
  border-radius: 10px;
  background-color: var(--color-white);
}
.fields fieldset,
.fields input,
.fields label {
  cursor: pointer;
}
.fields label {
  text-transform: uppercase;
}
.btns button {
  width: 100%;
  max-width: 212px;
  background-color: var(--color-success);
  color: var(--color-white);
}
.btns .cancel {
  background-color: var(--color-danger);
}
</style>