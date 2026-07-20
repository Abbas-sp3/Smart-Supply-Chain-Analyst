import { runPropagation } from "./src/features/scenario-simulator/services/propagationEngine";
import { getPresetById } from "./src/features/scenario-simulator/constants/disruption-presets";
import { INDIA_TRADE_GRAPH } from "./src/features/geopolitical-intelligence/knowledge-graph/indiaTradeGraph";
import { INDIA_CORRIDOR_FRACTION, PORT_CORRIDOR_FRACTION } from "./src/features/scenario-simulator/services/propagationEngine";
import type { StrategicReserveReleaseLever, SpotCharterLever } from "./src/features/scenario-simulator/types";

function getNodeBaslineMtpa(nodeId: string, presetAffectedNodeIds: string[]): number {
  const node = INDIA_TRADE_GRAPH.find((n) => n.id === nodeId);
  if (!node || !node.capacityMtpa) return 0;
  const util = (node.baseUtilizationPct ?? 75) / 100;

  if (node.type === "corridor") {
    const frac = INDIA_CORRIDOR_FRACTION[nodeId] ?? 0.05;
    return node.capacityMtpa * util * frac;
  }

  if (node.type === "port") {
    const activeCorridor = presetAffectedNodeIds.find(
      (id) => PORT_CORRIDOR_FRACTION[`${nodeId}:${id}`] !== undefined
    );
    const portFrac = activeCorridor
      ? (PORT_CORRIDOR_FRACTION[`${nodeId}:${activeCorridor}`] ?? 0.20)
      : 0.20;
    return node.capacityMtpa * util * portFrac;
  }

  return node.capacityMtpa * util;
}

async function verifyTrajectory() {
  const preset = getPresetById("hormuz_full_closure");
  if (!preset) { console.error("Preset not found"); return; }

  const sprLever: StrategicReserveReleaseLever = {
    type: "strategic_reserve_release",
    dailyRateMtpa: 0.0068,
    durationDays: 30,
  };

  const spotLever: SpotCharterLever = {
    type: "spot_charter",
    volumeMtpa: 15,
    alternativeCorridorId: "corridor_cape_good_hope",
    productId: "crude_oil",
  };

  const baseline = runPropagation(preset, [], INDIA_TRADE_GRAPH);
  const withLevers = runPropagation(preset, [sprLever, spotLever], INDIA_TRADE_GRAPH);

  console.log(`\n=== VERIFICATION: hormuz_full_closure with SPR+Spot levers ===`);
  console.log(`Baseline SSI: ${baseline.metrics.supplySecurityIndex}`);
  console.log(`With Levers SSI: ${withLevers.metrics.supplySecurityIndex}`);
  console.log(`\nTop 5 nodes (sorted by severity):`);

  const sorted = baseline.nodeImpacts
    .filter((n) => (n.lockedVolumeMtpa ?? 0) > 0 || n.effectiveSeverityPct > 0)
    .sort((a, b) => b.effectiveSeverityPct - a.effectiveSeverityPct)
    .slice(0, 5);

  for (const impact of sorted) {
    const baselineMtpa = getNodeBaslineMtpa(impact.nodeId, preset.affectedNodeIds);
    const withLeversImpact = withLevers.nodeImpacts.find((n) => n.nodeId === impact.nodeId);
    const disruptedMtpa = baselineMtpa * (1 - impact.effectiveSeverityPct / 100);
    const withLeversMtpa = withLeversImpact
      ? baselineMtpa * (1 - withLeversImpact.effectiveSeverityPct / 100)
      : null;

    console.log(`\n  [${impact.nodeType}] ${impact.nodeLabel}`);
    console.log(`    Severity: ${impact.effectiveSeverityPct.toFixed(1)}% | LagDays: ${impact.lagDays}`);
    console.log(`    Baseline flow: ${baselineMtpa.toFixed(2)} Mtpa`);
    console.log(`    Disrupted flow: ${disruptedMtpa.toFixed(2)} Mtpa`);
    console.log(`    Locked (no levers): ${(impact.lockedVolumeMtpa ?? 0).toFixed(2)} Mtpa`);
    if (withLeversImpact) {
      console.log(`    With levers flow: ${withLeversMtpa?.toFixed(2)} Mtpa`);
      console.log(`    Locked (with levers): ${(withLeversImpact.lockedVolumeMtpa ?? 0).toFixed(2)} Mtpa`);
      const severityChanged = Math.abs(withLeversImpact.effectiveSeverityPct - impact.effectiveSeverityPct) > 0.1;
      const lockedChanged = Math.abs((withLeversImpact.lockedVolumeMtpa ?? 0) - (impact.lockedVolumeMtpa ?? 0)) > 0.1;
      const hasEffect = severityChanged || lockedChanged;
      console.log(`    Lever has effect: ${hasEffect}`);
    }

    const recoveryDays = Math.min(preset.expectedDurationDays * 0.6, 30);
    console.log(`    Recovery ramp: ${recoveryDays.toFixed(1)} days (min(${preset.expectedDurationDays} × 0.6, 30))`);
  }
}

verifyTrajectory().catch(console.error);
