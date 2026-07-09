export type KnowledgeGraphNode = {
  id: string;
  type: "country" | "corridor" | "port" | "product" | "category" | "industry" | "infrastructure" | "resource";
  label: string;
  description: string;
  connections: KnowledgeGraphEdge[];
};

export type KnowledgeGraphEdge = {
  targetId: string;
  relationship: "supplies" | "routes_through" | "depends_on" | "produces" | "imports" | "threatens";
  strategicWeight: "Critical" | "High" | "Medium" | "Low";
};

export const INDIA_TRADE_GRAPH: KnowledgeGraphNode[] = [
  // Corridors
  {
    id: "corridor_hormuz",
    type: "corridor",
    label: "Strait of Hormuz",
    description: "Critical chokepoint between the Persian Gulf and the Gulf of Oman.",
    connections: [
      { targetId: "product_crude_oil", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "product_lng", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "corridor_bab_el_mandeb",
    type: "corridor",
    label: "Bab-el-Mandeb Strait / Red Sea",
    description: "Chokepoint between the Red Sea and the Gulf of Aden.",
    connections: [
      { targetId: "corridor_suez", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "country_europe", relationship: "routes_through", strategicWeight: "High" },
    ],
  },
  {
    id: "corridor_suez",
    type: "corridor",
    label: "Suez Canal",
    description: "Artificial sea-level waterway in Egypt, connecting the Mediterranean Sea to the Red Sea.",
    connections: [
      { targetId: "country_europe", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "corridor_malacca",
    type: "corridor",
    label: "Strait of Malacca",
    description: "Main shipping channel between the Indian Ocean and the Pacific Ocean.",
    connections: [
      { targetId: "country_china", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "country_taiwan", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "product_semiconductors", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "product_electronics", relationship: "routes_through", strategicWeight: "High" },
    ],
  },

  // Countries
  {
    id: "country_saudi_arabia",
    type: "country",
    label: "Saudi Arabia",
    description: "Major oil producer.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "corridor_hormuz", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_uae",
    type: "country",
    label: "UAE",
    description: "Major oil and gas producer.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "High" },
      { targetId: "corridor_hormuz", relationship: "routes_through", strategicWeight: "High" },
    ],
  },
  {
    id: "country_iraq",
    type: "country",
    label: "Iraq",
    description: "Major oil producer.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "High" },
      { targetId: "corridor_hormuz", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_russia",
    type: "country",
    label: "Russia",
    description: "Major supplier of oil, coal, and fertilizers.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_fertilizers", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_coal", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "country_usa",
    type: "country",
    label: "USA",
    description: "Supplier of crude oil, LNG, and high-tech components.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "product_lng", relationship: "supplies", strategicWeight: "Medium" },
    ],
  },
  {
    id: "country_china",
    type: "country",
    label: "China",
    description: "Major supplier of electronics, APIs, and rare earths.",
    connections: [
      { targetId: "product_electronics", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_apis", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_rare_earths", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "country_taiwan",
    type: "country",
    label: "Taiwan",
    description: "Leading manufacturer of advanced semiconductors.",
    connections: [
      { targetId: "product_semiconductors", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_australia",
    type: "country",
    label: "Australia",
    description: "Major supplier of coal and critical minerals.",
    connections: [
      { targetId: "product_coal", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "country_europe",
    type: "country",
    label: "Europe",
    description: "Trading partner for manufactured goods and machinery.",
    connections: [
      { targetId: "corridor_suez", relationship: "routes_through", strategicWeight: "High" },
    ],
  },
  
  // Ports
  {
    id: "port_jnpt",
    type: "port",
    label: "JNPT (Nhava Sheva)",
    description: "Largest container port in India, west coast.",
    connections: [
      { targetId: "corridor_suez", relationship: "depends_on", strategicWeight: "High" },
      { targetId: "corridor_hormuz", relationship: "depends_on", strategicWeight: "Medium" },
    ],
  },
  {
    id: "port_mundra",
    type: "port",
    label: "Mundra Port",
    description: "Largest private port in India, major commercial hub.",
    connections: [
      { targetId: "corridor_suez", relationship: "depends_on", strategicWeight: "High" },
      { targetId: "corridor_hormuz", relationship: "depends_on", strategicWeight: "High" },
    ],
  },
  {
    id: "port_vizag",
    type: "port",
    label: "Visakhapatnam (Vizag) Port",
    description: "Major port on the east coast of India.",
    connections: [
      { targetId: "corridor_malacca", relationship: "depends_on", strategicWeight: "High" },
    ],
  },
  {
    id: "port_kochi",
    type: "port",
    label: "Kochi Port",
    description: "Major port on the Arabian Sea (west coast).",
    connections: [
      { targetId: "corridor_suez", relationship: "depends_on", strategicWeight: "High" },
    ],
  },
  {
    id: "port_chennai",
    type: "port",
    label: "Chennai Port",
    description: "Major port on the Coromandel Coast (east coast).",
    connections: [
      { targetId: "corridor_malacca", relationship: "depends_on", strategicWeight: "High" },
    ],
  },
  {
    id: "port_paradip",
    type: "port",
    label: "Paradip Port",
    description: "Major port on the east coast, known for bulk cargo.",
    connections: [
      { targetId: "corridor_malacca", relationship: "depends_on", strategicWeight: "Medium" },
    ],
  },

  // Products
  {
    id: "product_crude_oil",
    type: "product",
    label: "Crude Oil",
    description: "Unrefined petroleum.",
    connections: [
      { targetId: "industry_refining", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_lng",
    type: "product",
    label: "Liquefied Natural Gas (LNG)",
    description: "Natural gas cooled to liquid state.",
    connections: [
      { targetId: "industry_power", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_lpg",
    type: "product",
    label: "Liquefied Petroleum Gas (LPG)",
    description: "Flammable mixture of hydrocarbon gases.",
    connections: [],
  },
  {
    id: "product_coal",
    type: "product",
    label: "Coal",
    description: "Combustible black or brownish-black sedimentary rock.",
    connections: [
      { targetId: "industry_power", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "industry_steel", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_semiconductors",
    type: "product",
    label: "Semiconductors",
    description: "Materials used in electronics.",
    connections: [
      { targetId: "industry_electronics", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "industry_automotive", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_rare_earths",
    type: "product",
    label: "Rare Earth Minerals",
    description: "Set of seventeen metallic elements.",
    connections: [
      { targetId: "industry_electronics", relationship: "supplies", strategicWeight: "High" },
      { targetId: "industry_defense", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_apis",
    type: "product",
    label: "Pharmaceutical APIs",
    description: "Active Pharmaceutical Ingredients.",
    connections: [
      { targetId: "industry_pharmaceuticals", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_fertilizers",
    type: "product",
    label: "Fertilizers",
    description: "Substances added to soil to increase productivity.",
    connections: [
      { targetId: "industry_agriculture", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_electronics",
    type: "product",
    label: "Electronics",
    description: "Electronic components and devices.",
    connections: [],
  },

  // Industries
  {
    id: "industry_refining",
    type: "industry",
    label: "Petroleum Refining",
    description: "Transforms crude oil into useful products.",
    connections: [],
  },
  {
    id: "industry_pharmaceuticals",
    type: "industry",
    label: "Pharmaceuticals",
    description: "Produces medications.",
    connections: [],
  },
  {
    id: "industry_electronics",
    type: "industry",
    label: "Electronics Manufacturing",
    description: "Produces electronic devices.",
    connections: [],
  },
  {
    id: "industry_automotive",
    type: "industry",
    label: "Automotive",
    description: "Produces motor vehicles.",
    connections: [],
  },
  {
    id: "industry_agriculture",
    type: "industry",
    label: "Agriculture",
    description: "Farming and cultivation.",
    connections: [],
  },
  {
    id: "industry_power",
    type: "industry",
    label: "Power Generation",
    description: "Generates electricity.",
    connections: [],
  },
  {
    id: "industry_steel",
    type: "industry",
    label: "Steel Production",
    description: "Manufactures steel.",
    connections: [],
  },
  {
    id: "industry_defense",
    type: "industry",
    label: "Defense",
    description: "Military and national security manufacturing.",
    connections: [],
  },
  {
    id: "product_fuel",
    type: "product",
    label: "Fuel",
    description: "Refined petroleum products.",
    connections: [
      { targetId: "industry_transportation", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "industry_transportation",
    type: "industry",
    label: "Transportation Logistics",
    description: "Movement of goods and people.",
    connections: [
      { targetId: "industry_agriculture", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "industry_manufacturing", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "industry_manufacturing",
    type: "industry",
    label: "General Manufacturing",
    description: "Production of goods.",
    connections: [],
  },
  {
    id: "country_india",
    type: "country",
    label: "India",
    description: "Primary destination.",
    connections: [
      { targetId: "industry_refining", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "industry_automotive", relationship: "depends_on", strategicWeight: "Critical" },
    ],
  }
];

// Update earlier nodes to connect the chain:
const refiningNode = INDIA_TRADE_GRAPH.find(n => n.id === "industry_refining");
if (refiningNode) {
  refiningNode.connections.push({ targetId: "product_fuel", relationship: "produces", strategicWeight: "Critical" });
}

const oilNode = INDIA_TRADE_GRAPH.find(n => n.id === "product_crude_oil");
if (oilNode) {
  oilNode.connections.push({ targetId: "product_lpg", relationship: "produces", strategicWeight: "Medium" });
  oilNode.connections.push({ targetId: "product_lng", relationship: "produces", strategicWeight: "Medium" });
}
