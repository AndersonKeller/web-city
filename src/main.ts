import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import "./styles/inputs.css"
import App from "./App.vue";
import "vue3-toastify/dist/index.css";
import "./styles/toastify.css"
import Vue3Toastify, { toast } from "vue3-toastify";
const pinia = createPinia();
const app = createApp(App);
app.use(pinia)
app.use(Vue3Toastify, {
  autoClose: 3000,
  position: "top-center",
  theme: "light",
  limit: 1,
  transition: toast.TRANSITIONS.FLIP,
  hideProgressBar:true
});
app.mount("#wrapper")
// createApp(App).mount("#wrapper");