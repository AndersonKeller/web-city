import type { GameMap } from "../map/gameMap-ts";
import type { iMapScanner } from "../map/mapScanner-ts";
import { Position } from "../utils/position";
import type { iRepairManager } from "../manager/repairManager-ts";

import { FIRESTATION, POLICESTATION } from "../tiles/tileValues";
import type { iSimulation } from "./simulation-ts";

export const emergencyServicesController = {
  handleService(censusStat: string, budgetEffect: string, blockMap: string) {
    return function (map: GameMap, x: number, y: number, simData: iSimulation) {
      simData.census[censusStat] += 1;
      let effect = simData.budget[budgetEffect];
      const isPowered = map.getTile(x, y).isPowered();
      if (!isPowered) {
        effect = Math.floor(effect / 2);
      }
      const pos = new Position(x, y);
      const connectedToRoads = simData.trafficManager.findPerimeterRoad(pos);
      if (!connectedToRoads) {
        effect = Math.floor(effect / 2);
      }
      let currentEffect = simData.blockMaps[blockMap].worldGet(x, y);
      currentEffect += effect;

      simData.blockMaps[blockMap].worldSet(x, y, currentEffect);
    };
  },

  registerHandlers(mapScanner: iMapScanner, _repairManager: iRepairManager) {
    mapScanner.addAction(POLICESTATION, policeStationFound);
    mapScanner.addAction(FIRESTATION, fireStationFound);
  },
};
const policeStationFound = emergencyServicesController.handleService("policeStationPop", "policeEffect", "policeStationMap");
const fireStationFound = emergencyServicesController.handleService("fireStationPop", "fireEffect", "fireStationMap");