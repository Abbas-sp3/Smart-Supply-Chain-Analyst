import { runPropagation } from "./src/features/scenario-simulator/services/propagationEngine";
import { getPresetById } from "./src/features/scenario-simulator/constants/disruption-presets";
import { INDIA_TRADE_GRAPH } from "./src/features/geopolitical-intelligence/knowledge-graph/indiaTradeGraph";
import { StrategicReserveReleaseLever, SpotCharterLever } from "./src/features/scenario-simulator/types";

async function testSSI() {
  const presetsToTest = ["hormuz_full_closure", "hormuz_partial", "suez_partial_blockage", "red_sea_interdiction"];
  
  const sprLever: StrategicReserveReleaseLever = {
    type: "strategic_reserve_release",
    dailyRateMtpa: 2.49, 
    durationDays: 30, 
  };
  
  const spotLever: SpotCharterLever = {
    type: "spot_charter",
    volumeMtpa: 15,
    alternativeCorridorId: "corridor_cape_good_hope",
    productId: "crude_oil"
  };

  for (const presetId of presetsToTest) {
    const preset = getPresetById(presetId);
    if (!preset) continue;

    const baseline = runPropagation(preset, [], INDIA_TRADE_GRAPH);
    const withLevers = runPropagation(preset, [sprLever, spotLever], INDIA_TRADE_GRAPH);

    console.log(`\n=== PRESET: ${presetId} ===`);
    console.log(`Baseline Supply Gap: ${baseline.metrics.supplyGapMtpa.likely.toFixed(1)} Mtpa`);
    console.log(`Baseline SSI: ${baseline.metrics.supplySecurityIndex}`);
    console.log(`With Lever Supply Gap: ${withLevers.metrics.supplyGapMtpa.likely.toFixed(1)} Mtpa`);
    console.log(`With Lever SSI: ${withLevers.metrics.supplySecurityIndex}`);
  }
}

testSSI().catch(console.error);
