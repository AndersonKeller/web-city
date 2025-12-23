import { defineStore } from "pinia";
import { budgetController } from "../game/simulation/budget-ts";

export const simulationStore = defineStore("simulationStore", {
  state: () => {
    return {
      funds: budgetController.totalFunds,
      population: 0,
      classification: "",
      score: 0,
      date: "",
      name: "",
    };
  },
  getters: {
    getFund: (state) => state.funds,
    getPopulation: (state) => state.population,
    getClassification: (state) => state.classification,
    getScore: (state) => state.score,
    getDate: (state) => state.date,
    getName: (state) => state.name,
  },
  actions: {
    setFunds(value: number) {
      this.funds = value;
    },
    setPopulation(value: number) {
      this.population = value;
    },
    setClassification(value: string) {
      this.classification = value;
    },
    setScore(value: number) {
      this.score = value;
    },
    setDate(value: string) {
      this.date = value;
    },
    setName(value: string) {
      this.name = value;
    },
  },
});