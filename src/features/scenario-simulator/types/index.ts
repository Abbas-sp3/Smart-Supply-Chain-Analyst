/**
 * Scenario Simulator — Core Type Definitions
 *
 * All types are self-contained; no dependency on geopolitical-intelligence
 * module types, keeping the simulator fully decoupled.
 *
 * Design constraints encoded here:
 *  - Ranges, not point estimates        (RangeEstimate)
 *  - Degraded states, not binary        (severityPct on DisruptionPreset)
 *  - Flexibility / contract constraints (flexibilityFactor from graph node)
 *  - Time-lagged propagation            (bufferDays per node applied in engine)
 *  - Reserve floor policy               (minReserveFloorDays in ReserveConfig)
 *  - Named SSI weights config           (SsiWeights — swappable per persona)
 *  - Visible assumptions                (MetricsSurface.assumptions string[])
 *  - Insurance decay curve              (premiumDecayModel on DisruptionPreset)
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * Triangular distribution triple.
 * The engine computes min/likely/max for every quantitative output.
 * Full Monte Carlo can upgrade this later without changing the type.
 */
export type RangeEstimate = {
  min: number;
  likely: number;
  max: number;
  unit: string;
};

// ---------------------------------------------------------------------------
// Disruption Preset — the "event library" record
// ---------------------------------------------------------------------------

/**
 * One entry in the disruption event library.
 * The propagation engine consumes this as its sole scenario input.
 * Bespoke per-scenario code does NOT exist — the engine is the product.
 */
export type DisruptionPreset = {
  /** Stable machine-readable key, used in URL params and API payloads. */
  id: string;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Short one-line description for cards and tooltips. */
  description: string;

  /**
   * Graph node IDs whose throughput is directly degraded by this event.
   * Downstream nodes propagate via BFS through the knowledge graph.
   */
  affectedNodeIds: string[];

  /**
   * Most-likely percentage throughput capacity reduction on affectedNodeIds.
   * 0 = no reduction; 100 = full closure.
   */
  severityPct: number;

  /** Severity range used to compute output min/max bounds. Unit: "percent". */
  severityRange: RangeEstimate;

  /** Central estimate of event duration (days). */
  expectedDurationDays: number;

  /** Duration range for sensitivity analysis. Unit: "days". */
  durationRange: RangeEstimate;

  /**
   * Additional freight cost premium when volume must reroute via spot charter
   * (percentage above the current baseline freight rate index).
   */
  spotFreightPenaltyPct: number;

  /**
   * War-risk / disruption marine insurance peak premium (basis points).
   * 100 bps = 1% of cargo value.
   * Time profile is governed by premiumDecayModel.
   */
  insurancePremiumPeakBps: number;

  /**
   * How the insurance premium evolves over the event duration:
   *   "linear_ramp_plateau_decay": ramp over first 20% of duration,
   *     plateau through middle 60%, linear decay over final 20%.
   *   "flat": constant at peak for full duration.
   *   "custom": reserved for future implementation.
   */
  premiumDecayModel: "linear_ramp_plateau_decay" | "flat" | "custom";

  /**
   * When live AIS anomaly count on this corridor exceeds this value the UI
   * surfaces a "Simulate this?" suggestion.
   * NOT an auto-trigger — user must click to confirm.
   */
  aisAnomalyThreshold: number;

  /**
   * Historical real-world case for Phase 2 engine validation.
   * Optional — only set on presets where a documented event exists.
   */
  historicalCalibrationCase?: HistoricalCalibrationCase;

  /** Geographic centre of the disruption [longitude, latitude] for map display. */
  mapCoordinates: [number, number];

  /** Category used for grouping in the UI preset picker. */
  category: "energy" | "food_agriculture" | "manufacturing" | "multi_sector";
};

/**
 * Documented real-world event used as Phase 2 regression test.
 * The engine must produce ETA shift and supply gap within the reported ranges.
 */
export type HistoricalCalibrationCase = {
  eventName: string;
  year: number;
  actualDurationDays: number;
  reportedEtaShiftDays: RangeEstimate;
  reportedSupplyGapMtpa: RangeEstimate;
  sourceDescription: string;
};

// ---------------------------------------------------------------------------
// Decision Levers — user-applied interventions
// ---------------------------------------------------------------------------

export type DecisionLever =
  | StrategicReserveReleaseLever
  | SpotCharterLever
  | SupplierSwitchLever
  | ExportBanLever
  | DiplomaticAllocationLever;

export type StrategicReserveReleaseLever = {
  type: "strategic_reserve_release";
  /** Rate-limited drawdown — engine enforces maxDailyDrawdownMtpa from ReserveConfig. */
  dailyRateMtpa: number;
  durationDays: number;
};

export type SpotCharterLever = {
  type: "spot_charter";
  volumeMtpa: number;
  alternativeCorridorId: string;
  productId: string;
};

export type SupplierSwitchLever = {
  type: "supplier_switch";
  fromCountryId: string;
  toCountryId: string;
  productId: string;
  volumeMtpa: number;
};

export type ExportBanLever = {
  type: "export_ban";
  productId: string;
  /** Volume redirected from export to domestic consumption (Mtpa). */
  volumeMtpa: number;
  durationDays: number;
};

export type DiplomaticAllocationLever = {
  type: "diplomatic_allocation";
  partnerId: string;
  productId: string;
  volumeMtpa: number;
  /** Additional cost vs. market rate (%). */
  costPremiumPct: number;
};

// ---------------------------------------------------------------------------
// Propagation Engine Output
// ---------------------------------------------------------------------------

/**
 * Per-node impact computed by the propagation engine.
 * Returned as part of PropagationResult for analyst drill-down.
 */
export type CorridorImpactResult = {
  nodeId: string;
  nodeLabel: string;
  nodeType: "corridor" | "port" | "industry" | "infrastructure";
  /** Effective throughput reduction after flexibility and levers applied (%). */
  effectiveSeverityPct: number;
  /** Residual spare capacity after diversion (Mtpa). Null if node has no capacityMtpa. */
  spareCapacityMtpa: number | null;
  /**
   * Volume locked to this node due to contract/flexibility constraints (Mtpa).
   * = affectedVolume × (1 - flexibilityFactor)
   */
  lockedVolumeMtpa: number | null;
  /** Days after disruption onset when this node first feels the effect. */
  lagDays: number;
  /** Human-readable rationale for the analyst drill-down panel. */
  rationale: string;
};

/**
 * Full output of one propagation engine run.
 * The LLM briefing narrates this — it never modifies it.
 */
export type PropagationResult = {
  presetId: string;
  appliedLevers: DecisionLever[];
  computedAt: string; // ISO timestamp
  nodeImpacts: CorridorImpactResult[];
  metrics: MetricsSurface;
};

// ---------------------------------------------------------------------------
// Metrics Surface
// ---------------------------------------------------------------------------

/**
 * Named SSI weighting configuration.
 * Weights MUST sum to 1.0.
 * Swappable per persona (GoI view vs. private refiner) without engine changes.
 *
 * Approved weights (Phase 1 decision):
 *   supplyGapVolume:      0.35
 *   etaShift:             0.25
 *   reserveTrajectory:    0.30  (higher weight: India's reserve buffer is thin vs. IEA norms)
 *   freightAndInsurance:  0.10
 */
export type SsiWeights = {
  supplyGapVolume: number;
  etaShift: number;
  reserveTrajectory: number;
  freightAndInsuranceCost: number;
};

/**
 * All computed metrics after one engine run + lever set.
 * Every number is a RangeEstimate; no silent point estimates.
 * The assumptions array makes every simplification explicit.
 */
export type MetricsSurface = {
  /** Incremental landed cost above baseline (USD/bbl for oil, USD/MT for others). */
  landedCostDeltaPerUnit: RangeEstimate;

  /** Additional transit time caused by disruption / rerouting (days). */
  etaShiftDays: RangeEstimate;

  /** Volume that cannot be sourced or rerouted (Mtpa). */
  supplyGapMtpa: RangeEstimate;

  /**
   * Days until India's strategic reserve reaches minReserveFloorDays
   * at the computed drawdown rate. Null if reserve is not being drawn.
   */
  reserveDepletionDaysToFloor: number | null;

  /** Normalised freight rate index (100 = pre-disruption baseline). */
  freightRateIndex: RangeEstimate;

  /** Marine war-risk / disruption insurance premium (bps above normal). */
  insurancePremiumBps: RangeEstimate;

  /**
   * Per-industry output risk: percentage of normal output that may be lost
   * if disruption persists beyond the industry's bufferDays.
   * Keyed by industry node ID from the knowledge graph.
   */
  industryOutputRiskPct: Record<string, RangeEstimate>;

  /**
   * Composite Supply Security Index: 0 (catastrophic) — 100 (fully secure).
   * Computed as weighted combination per ssiWeightsUsed.
   */
  supplySecurityIndex: number;

  /** Weights used to compute supplySecurityIndex — stored for transparency. */
  ssiWeightsUsed: SsiWeights;

  /**
   * All simplifying assumptions the engine made in this run.
   * No silent simplifications — every one must appear here.
   * Shown in the analyst drill-down panel on demand.
   */
  assumptions: string[];
};

// ---------------------------------------------------------------------------
// UI State
// ---------------------------------------------------------------------------

export type SimulationStatus = "idle" | "computing" | "done" | "error";

export type SimulationState = {
  status: SimulationStatus;
  activePresetId: string | null;
  levers: DecisionLever[];
  result: PropagationResult | null;
  /** LLM-generated narrative summary of computed metrics. Off by default. */
  llmBriefing: string | null;
  llmBriefingEnabled: boolean;
  error: string | null;
};

/**
 * Payload surfaced when AIS anomaly count breaches a preset's threshold.
 * The UI shows a "Simulate this?" prompt — user must click to confirm.
 */
export type AisAnomalySuggestion = {
  presetId: string;
  presetLabel: string;
  detectedAnomalyCount: number;
  thresholdCount: number;
  corridorId: string;
};
