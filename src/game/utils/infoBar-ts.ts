import { simulationStore } from "../../stores/simulation.store.ts";
import type { iSimulation } from "../simulation/simulation-ts.ts";
import { textUtils } from "./text-ts.ts";
import * as Messages from "./messages.ts";
interface iInfoBarProps {
  classification: string;
  population: number;
  score: number;
  funds: number;
  date: { month: string; year: string };
  name: string;
}
export type iInfoBar = typeof infoBarController;
export const infoBarController = {
  init(dataSource: iSimulation, initialValues: iInfoBarProps) {
    simulationStore().setScore(initialValues.score);
    simulationStore().setPopulation(initialValues.population);
    simulationStore().setClassification(initialValues.classification);
    simulationStore().setFunds(initialValues.funds);

    simulationStore().setDate([textUtils.months[initialValues.date.month], initialValues.date.year].join(" "));

    simulationStore().setName(initialValues.name);
    dataSource.addEventListener(Messages.CLASSIFICATION_UPDATED, (classification: string) => simulationStore().setClassification(classification));
    dataSource.addEventListener(Messages.POPULATION_UPDATED, function (population: number) {
      simulationStore().setPopulation(population);
    });

    dataSource.addEventListener(Messages.SCORE_UPDATED, function (score: number) {
      simulationStore().setScore(score);
    });

    dataSource.addEventListener(Messages.FUNDS_CHANGED, function (funds: number) {
      simulationStore().setFunds(funds);
    });

    dataSource.addEventListener(Messages.DATE_UPDATED, function (date: { month: string; year: string }) {
      simulationStore().setDate([textUtils.months[date.month], date.year].join(" "));
    });
  },
};