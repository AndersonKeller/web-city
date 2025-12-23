import { defineStore } from "pinia";

export const notificationStore = defineStore("notificationStore", {
  state: () => {
    return {
      message: "",
      type: "" as "neutral" | "good" | "bad",
      data: null as {
        x: number;
        y: number;
        sprite?: null;
      },
    };
  },
  getters: {
    getNotification: (state) => {
      return { message: state.message, type: state.type };
    },
    getType: (state) => state.type,
    getData: (state) => state.data,
  },
  actions: {
    setData(value: { x: number; y: number; sprite?: any }) {
      this.data = value;
    },
    clearData() {
      this.data = null;
    },
    setMessage(value: string) {
      this.message = value;
    },
    setType(value: "bad" | "neutral" | "good") {
      this.type = value;
    },
    setNotification(value: string, typeValue: "bad" | "neutral" | "good") {
      this.message = value;
      this.type = typeValue;
    },
  },
});