export type RefinerySector = "Public" | "Private" | "Joint Venture";

export type RefineryRecord = {
  name: string;
  owner: string;
  sector: RefinerySector;
  state: string;
  location: string;
  commissioned: string;
  capacityMMTPA: number;
  expandingToMMTPA?: number;
  nelsonComplexityIndex: number | null;
};

export type RefineryWithStatus = RefineryRecord & {
  id: string;
  status: "operational" | "expanding" | "legacy";
  region: "west" | "north" | "east" | "south" | "northeast";
  utilizationPct: number;
  crudeGrades: string[];
  products: { name: string; pctOfOutput: number }[];
  bufferDays: number;
};

export type RefineryCluster = {
  region: string;
  label: string;
  refineries: RefineryWithStatus[];
  totalCapacityMMTPA: number;
};

export type CrudeGrade = {
  name: string;
  origin: string;
  api: number;
  sulfur: number;
  type: "sweet" | "sour" | "medium";
};

export type DisruptionScenario = {
  id: string;
  name: string;
  description: string;
  affectedRefineryNames: string[];
  severityImpactPct: number;
  durationDays: number;
};

export type DisruptionImpact = {
  scenarioId: string;
  affectedRefineries: { name: string; lostCapacityMMTPA: number }[];
  totalLostCapacityMMTPA: number;
  nationalCapacityAfter: number;
  supplyGapPct: number;
  fuelShortageDays: number;
  estimatedPriceImpactPct: number;
  affectedProducts: { name: string; shortagePct: number }[];
};

export type RefineryDashboardData = {
  refineries: RefineryWithStatus[];
  clusters: RefineryCluster[];
  nationalStats: {
    totalCapacityMMTPA: number;
    operationalCount: number;
    expandingCount: number;
    totalRefineries: number;
    avgNelsonComplexity: number;
  };
  crudeCompatibility: {
    grades: CrudeGrade[];
    matrix: Record<string, string[]>;
  };
  scenarios: DisruptionScenario[];
  dataSource: string;
};
