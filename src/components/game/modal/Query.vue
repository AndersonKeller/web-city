<script setup lang="ts">
import { onMounted, ref } from "vue";

import { queryToolController } from "../../../game/tools/queryTool-ts";

import { modalStore } from "../../../stores/modal.store";
import { Config } from "../../../game/utils/config-ts";
const query = ref(queryToolController);
const show = ref(false);
const config = Config;

onMounted(() => {
  show.value = false;
  queryToolController.doTool(modalStore().queryPos.x, modalStore().queryPos.y, modalStore().queryPos.blockmaps);
  show.value = true;
});
</script>
<template>
  <div class="modal shadow">
    <header class="query_header">
      <h2>Query</h2>
    </header>
    <div class="query_container">
      <ul v-if="show" class="query_list">
        <li>
          <p>Zone:</p>
          <p>{{ query.queryZoneType }}</p>
        </li>
        <li>
          <p>Density:</p>
          <p>{{ query.queryDensity }}</p>
        </li>
        <li>
          <p>Value:</p>
          <p>{{ query.queryLandValue }}</p>
        </li>
        <li>
          <p>Crime:</p>
          <p>{{ query.queryCrime }}</p>
        </li>
        <li>
          <p>Pollution:</p>
          <p>{{ query.queryPollution }}</p>
        </li>
        <li>
          <p>Growth:</p>
          <p>{{ query.queryRate }}</p>
        </li>
        <!-- <dt class="queryItem">Zone</dt>
          <dd class="queryItem queryRight" id="queryZoneType">{{ query.zoneType }}</dd>
          <dt class="queryItem">Density</dt>
          <dd class="queryItem queryRight" id="queryDensity"></dd>
          <dt class="queryItem">Value</dt>
          <dd class="queryItem queryRight" id="queryLandValue"></dd>
          <dt class="queryItem">Crime</dt>
          <dd class="queryItem queryRight" id="queryCrime"></dd>
          <dt class="queryItem">Pollution</dt>
          <dd class="queryItem queryRight" id="queryPollution"></dd>
          <dt class="queryItem">Growth</dt>
          <dd class="queryItem queryRight" id="queryRate"></dd> -->
      </ul>
      <div v-if="(config.debug || config.queryDebug) && show" class="query_debug">
        <h2>DEBUG</h2>
        <ul class="debug_list">
          <li>
            <p>Tile</p>
            <p>{{ query.debug.queryTile }}</p>
          </li>
          <li>
            <p>TileValue</p>
            <p>{{ query.debug.queryTileValue }}</p>
          </li>
          <li>
            <p>FireStation</p>
            <p>{{ query.debug.queryFireStationRaw }}</p>
          </li>
          <li>
            <p>FireStationEffect</p>
            <p>{{ query.debug.queryFireStationEffectRaw }}</p>
          </li>
          <li>
            <p>TerrainDensity</p>
            <p>{{ query.debug.queryTerrainDensityRaw }}</p>
          </li>
          <li>
            <p>PoliceStation</p>
            <p>{{ query.debug.queryPoliceStationRaw }}</p>
          </li>
          <li>
            <p>PoliceStationEffect</p>
            <p>{{ query.debug.queryPoliceStationRaw }}</p>
          </li>
          <li>
            <p>ComRate</p>
            <p>{{ query.debug.queryComRateRaw }}</p>
          </li>
          <li>
            <p>RateOfGrowth</p>
            <p>{{ query.debug.queryRateRaw }}</p>
          </li>
          <li>
            <p>Pollution</p>
            <p>{{ query.debug.queryPollutionRaw }}</p>
          </li>
          <li>
            <p>Crime</p>
            <p>{{ query.debug.queryCrimeRaw }}</p>
          </li>
          <li>
            <p>LandValue</p>
            <p>{{ query.debug.queryLandValueRaw }}</p>
          </li>
          <li>
            <p>Traffic Density</p>
            <p>{{ query.debug.queryTrafficDensityRaw }}</p>
          </li>
          <li>
            <p>Density</p>
            <p>{{ query.debug.queryDensityRaw }}</p>
          </li>
        </ul>

        <div class="flags">
          <li>
            <p>Burn</p>
            <p>{{ query.flags.queryTileBurnable }}</p>
          </li>
          <li>
            <p>Bull</p>
            <p>{{ query.flags.queryTileBulldozable }}</p>
          </li>
          <li>
            <p>Cond</p>
            <p>{{ query.flags.queryTileCond }}</p>
          </li>
          <li>
            <p>Anim</p>
            <p>{{ query.flags.queryTileAnim }}</p>
          </li>
          <li>
            <p>Pow</p>
            <p>{{ query.flags.queryTilePowered }}</p>
          </li>
          <li>
            <p>Zone</p>
            <p>{{ query.flags.queryTileZone }}</p>
          </li>
        </div>
      </div>

      <button @click="modalStore().closeAll()" type="button">OK</button>
    </div>
  </div>
</template>
<style scoped>
.query_container {
  display: flex;
  flex-direction: column;
  padding: 24px;
}
.query_container ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 50%;
  margin: 0 auto;
  padding-bottom: 16px;
}
.query_debug h2 {
  text-align: center;
}
.query_container .query_list li {
  box-shadow: 3px 3px 6px var(--color-gray-300);
  border-radius: 10px;
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  padding: 4px 12px;
}
.query_container .debug_list {
  flex-direction: row;
  flex-wrap: wrap;
  width: 80%;
}
.query_container .debug_list li {
  border: 1px solid var(--color-danger);
  padding: 2px;
}
.query_container .query_list li p {
  font-weight: 500;
}
.flags {
  display: flex;
  border: 1px solid var(--color-gray-300);
  width: max-content;
  padding: 6px 24px;
  margin: 0 auto;
  gap: 12px;
  margin-bottom: 16px;
}
.flags li {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
button {
  background-color: var(--color-success);
  color: var(--color-white);
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
}
</style>