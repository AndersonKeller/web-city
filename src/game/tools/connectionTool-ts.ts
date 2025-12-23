import { baseToolController } from "./baseTool-ts";
import { Connector } from "./connector-ts";

export const connectingToolController = {
  create(toolConstructor) {
    const res = Connector(baseToolController.makeTool(toolConstructor));

    return res;
  },
};