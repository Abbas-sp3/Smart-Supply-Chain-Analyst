export type KnowledgeGraphNode = {
  id: string;
  type:
    | "country"
    | "corridor"
    | "port"
    | "product"
    | "category"
    | "industry"
    | "infrastructure"
    | "resource";
  label: string;
  description: string;
  aliases?: string[]; // alternative names for entity matching
  connections: KnowledgeGraphEdge[];

  // ── Capacity / constraint metadata (optional; only set on curated critical nodes) ──
  /** Peak annual throughput ceiling (million tonnes per annum). */
  capacityMtpa?: number;
  /** Fraction of capacity currently utilised under normal conditions (0–100). */
  baseUtilizationPct?: number;
  /** Inventory / transit buffer before a disruption propagates downstream (days). */
  bufferDays?: number;
  /**
   * Fraction of routed volume that can switch to an alternative route/supplier
   * without a contract penalty or chartering constraint (0.0 – 1.0).
   * Remaining volume (1 - flexibilityFactor) is locked to this node.
   */
  flexibilityFactor?: number;
  /** Provenance citation for the capacity figure — required when capacityMtpa is set. */
  dataSource?: string;
  /**
   * Semantic meaning of capacityMtpa for this node.
   *   "throughput"         — volume that can FLOW THROUGH (corridor, port).
   *                          Engine applies: spare_capacity vs. diverted_volume logic.
   *   "production_output" — volume that can be MADE here (factory, refinery complex).
   *                          Engine applies: output_loss logic; no rerouting concept.
   * Defaults to "throughput" when absent — all existing nodes are transit nodes.
   */
  capacityType?: "throughput" | "production_output";
};

export type KnowledgeGraphEdge = {
  targetId: string;
  relationship:
    | "supplies"
    | "routes_through"
    | "depends_on"
    | "produces"
    | "imports"
    | "threatens"
    | "can_replace"
    | "feeds_into"
    | "operates_at";
  strategicWeight: "Critical" | "High" | "Medium" | "Low";
};

export const INDIA_TRADE_GRAPH: KnowledgeGraphNode[] = [
  // =========================================================================
  // TRADE CORRIDORS
  // =========================================================================
  {
    id: "corridor_hormuz",
    type: "corridor",
    label: "Strait of Hormuz",
    aliases: ["hormuz", "persian gulf strait"],
    description:
      "Critical chokepoint handling ~20% of global oil trade between the Persian Gulf and Gulf of Oman.",
    // ── Capacity metadata ──
    capacityMtpa: 920,          // ~18.5 Mbbl/d liquids + 4 bcf/d LNG at peak; converted to Mtpa
    baseUtilizationPct: 88,
    bufferDays: 3,              // India holds ~3 days crude in-transit buffer; strategic reserve separate
    flexibilityFactor: 0.25,    // 25% spot-chartered; 75% long-term contracts through Hormuz
    dataSource: "EIA World Chokepoints for Global Energy Security, 2025 update",
    connections: [
      { targetId: "product_crude_oil", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "product_lng", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "product_lpg", relationship: "routes_through", strategicWeight: "High" },
      { targetId: "port_mundra", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "port_jnpt", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "port_kandla", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "port_mangalore", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "corridor_bab_el_mandeb",
    type: "corridor",
    label: "Bab-el-Mandeb Strait / Red Sea",
    aliases: ["bab-el-mandeb", "bab el mandeb", "red sea", "houthi"],
    description:
      "Chokepoint between the Red Sea and the Gulf of Aden; gateway to Suez Canal.",
    // ── Capacity metadata ──
    capacityMtpa: 380,          // ~5.1 Mbbl/d oil + container volume; EIA 2024
    baseUtilizationPct: 72,     // Post-Houthi disruption utilization down from ~85%
    bufferDays: 5,              // Slightly longer buffer; ships can anchor or slow-steam
    flexibilityFactor: 0.40,    // Higher spot mix for containerised cargo
    dataSource: "EIA World Chokepoints for Global Energy Security, 2024; UNCTAD Review of Maritime Transport 2024",
    connections: [
      { targetId: "corridor_suez", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "product_crude_oil", relationship: "routes_through", strategicWeight: "High" },
      { targetId: "port_jnpt", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "port_mundra", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "port_kochi", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "corridor_suez",
    type: "corridor",
    label: "Suez Canal",
    aliases: ["suez"],
    description:
      "Artificial waterway in Egypt connecting Mediterranean to Red Sea; ~12% of global trade.",
    // ── Capacity metadata ──
    capacityMtpa: 1100,         // ~106 net transits/day at ~10,000 TEU avg; SCA Annual Report 2023
    baseUtilizationPct: 65,     // Down ~30% from 2023 highs due to Red Sea rerouting
    bufferDays: 7,              // Longer buffer; Europe-India transit = 18–22 days
    flexibilityFactor: 0.50,    // High spot/tramp ratio for containerised cargo
    dataSource: "Suez Canal Authority Statistical Year Book 2023; IMF PortWatch 2024",
    connections: [
      { targetId: "country_europe", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "product_machinery", relationship: "routes_through", strategicWeight: "High" },
      { targetId: "port_jnpt", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "port_mundra", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "corridor_malacca",
    type: "corridor",
    label: "Strait of Malacca",
    aliases: ["malacca", "malacca strait"],
    description:
      "Main shipping channel between Indian Ocean and Pacific Ocean; ~25% of global trade.",
    // ── Capacity metadata ──
    capacityMtpa: 1650,         // ~100,000 vessels/yr × avg cargo; MPA Singapore 2023
    baseUtilizationPct: 82,
    bufferDays: 4,
    flexibilityFactor: 0.35,
    dataSource: "Maritime and Port Authority of Singapore 2023; IMF PortWatch Malacca Node",
    connections: [
      { targetId: "country_china", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "country_taiwan", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "country_south_korea", relationship: "routes_through", strategicWeight: "High" },
      { targetId: "country_japan", relationship: "routes_through", strategicWeight: "High" },
      { targetId: "product_semiconductors", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "product_electronics", relationship: "routes_through", strategicWeight: "High" },
      { targetId: "product_palm_oil", relationship: "routes_through", strategicWeight: "High" },
      { targetId: "port_chennai", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "port_vizag", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "port_kolkata", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "port_ennore", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "corridor_south_china_sea",
    type: "corridor",
    label: "South China Sea",
    aliases: ["south china sea", "scs", "spratly", "paracel"],
    description:
      "Contested waterway; ~$3 trillion in trade passes through annually.",
    // ── Capacity metadata ──
    // No single authoritative throughput figure exists for an open sea area.
    // Capacity is modelled as the effective chokepoint at the Luzon Strait / Taiwan Strait
    // sub-corridors, which act as the functional bottleneck under a blockade scenario.
    capacityMtpa: 1800,         // ANALYST_ESTIMATE: ~$3T trade/yr ÷ avg commodity value; consistent
                                //   with IMF PortWatch SCS node estimate range 2024
    baseUtilizationPct: 70,    // ANALYST_ESTIMATE: normal peacetime throughput
    bufferDays: 6,             // ANALYST_ESTIMATE: transit time buffer; Asia-India leg ~10-15 days
    flexibilityFactor: 0.30,   // ANALYST_ESTIMATE: rerouting via Lombok/Sunda straits possible
                               //   but adds 2-4 days and requires vessel draft assessment
    dataSource: "ANALYST_ESTIMATE — no public throughput authority for open sea; calibrated against IMF PortWatch SCS region 2024 and UNCTAD maritime estimates",
    connections: [
      { targetId: "country_china", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "country_taiwan", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "corridor_malacca", relationship: "routes_through", strategicWeight: "High" },
      { targetId: "product_semiconductors", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "corridor_panama",
    type: "corridor",
    label: "Panama Canal",
    aliases: ["panama canal", "panama"],
    description:
      "Connects Atlantic and Pacific; drought restrictions affect global shipping capacity.",
    connections: [
      { targetId: "product_lng", relationship: "routes_through", strategicWeight: "Medium" },
      { targetId: "product_coal", relationship: "routes_through", strategicWeight: "Medium" },
    ],
  },
  {
    id: "corridor_black_sea",
    type: "corridor",
    label: "Black Sea",
    aliases: ["black sea", "bosphorus", "turkish straits"],
    description:
      "Critical for grain and fertilizer exports from Russia and Ukraine.",
    // ── Capacity metadata ──
    capacityMtpa: 220,          // ~140 MT grain + 80 MT other; UNCTAD 2023
    baseUtilizationPct: 55,     // Severely disrupted; conflict-era utilisation
    bufferDays: 14,             // India holds seasonal grain buffer
    flexibilityFactor: 0.45,
    dataSource: "UNCTAD Review of Maritime Transport 2023; Black Sea Grain Initiative data",
    connections: [
      { targetId: "product_fertilizers", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "product_food_grains", relationship: "routes_through", strategicWeight: "High" },
      { targetId: "product_edible_oil", relationship: "routes_through", strategicWeight: "High" },
    ],
  },
  {
    id: "corridor_cape_good_hope",
    type: "corridor",
    label: "Cape of Good Hope",
    aliases: ["cape of good hope", "cape route"],
    description:
      "Alternative route when Red Sea / Suez is disrupted; adds 10-14 days transit.",
    // ── Capacity metadata ──
    // No hard throughput ceiling (open ocean), but vessel speed and port capacity at
    // transshipment hubs (Durban, Port Louis) creates a soft bottleneck.
    capacityMtpa: 2800,         // Theoretical open-ocean capacity; practical constraint is bunker/hub
    baseUtilizationPct: 68,     // Surge utilisation post-Red Sea crisis
    bufferDays: 14,             // Adds 10–14 days to Europe-India transit
    flexibilityFactor: 0.90,    // High flexibility — no congested chokepoint
    dataSource: "IMF PortWatch Cape Route Node 2024; BIMCO Shipping Market Analysis Q1 2024",
    connections: [
      { targetId: "country_europe", relationship: "routes_through", strategicWeight: "Medium" },
    ],
  },

  // =========================================================================
  // COUNTRIES (Source/Supplier Nations)
  // =========================================================================
  {
    id: "country_saudi_arabia",
    type: "country",
    label: "Saudi Arabia",
    aliases: ["saudi", "ksa", "kingdom of saudi arabia"],
    description: "India's 2nd largest crude oil supplier; also supplies LPG and petrochemicals.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_lpg", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_fertilizers", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "corridor_hormuz", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_iraq",
    type: "country",
    label: "Iraq",
    aliases: ["iraq"],
    description: "India's largest crude oil supplier (~23% of imports).",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "corridor_hormuz", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_uae",
    type: "country",
    label: "United Arab Emirates",
    aliases: ["uae", "emirates", "dubai", "abu dhabi"],
    description: "Major oil/gas supplier and trading hub for India.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_lng", relationship: "supplies", strategicWeight: "High" },
      { targetId: "corridor_hormuz", relationship: "routes_through", strategicWeight: "High" },
    ],
  },
  {
    id: "country_iran",
    type: "country",
    label: "Iran",
    aliases: ["iran", "tehran"],
    description: "Strategic oil supplier; sanctions affect supply availability.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "High" },
      { targetId: "corridor_hormuz", relationship: "threatens", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_qatar",
    type: "country",
    label: "Qatar",
    aliases: ["qatar", "doha"],
    description: "World's largest LNG exporter; key supplier to India.",
    connections: [
      { targetId: "product_lng", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "corridor_hormuz", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_kuwait",
    type: "country",
    label: "Kuwait",
    aliases: ["kuwait"],
    description: "Oil supplier to India.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "corridor_hormuz", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_oman",
    type: "country",
    label: "Oman",
    aliases: ["oman", "muscat"],
    description: "Oil and LNG supplier near Hormuz.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "product_lng", relationship: "supplies", strategicWeight: "Medium" },
    ],
  },
  {
    id: "country_russia",
    type: "country",
    label: "Russia",
    aliases: ["russia", "russian", "moscow", "kremlin"],
    description:
      "Major supplier of discounted crude oil, coal, fertilizers; sanctions create payment complexities.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_fertilizers", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_coal", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_defence_equipment", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "country_usa",
    type: "country",
    label: "United States",
    aliases: ["usa", "us", "united states", "america", "washington"],
    description:
      "Supplier of crude oil, LNG, high-tech components; sanctions/export controls affect supply chains.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "product_lng", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_semiconductors", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_defence_equipment", relationship: "supplies", strategicWeight: "Medium" },
    ],
  },
  {
    id: "country_china",
    type: "country",
    label: "China",
    aliases: ["china", "chinese", "beijing", "prc"],
    description:
      "India's largest goods trading partner; critical supplier of electronics, APIs, rare earths, solar panels.",
    connections: [
      { targetId: "product_electronics", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_apis", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_rare_earths", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_solar_panels", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_machinery", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_industrial_chemicals", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_steel", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "corridor_malacca", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_taiwan",
    type: "country",
    label: "Taiwan",
    aliases: ["taiwan", "taipei", "tsmc"],
    description: "Leading manufacturer of advanced semiconductors (TSMC).",
    connections: [
      { targetId: "product_semiconductors", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "corridor_malacca", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "corridor_south_china_sea", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_south_korea",
    type: "country",
    label: "South Korea",
    aliases: ["south korea", "korea", "seoul", "samsung"],
    description: "Major supplier of semiconductors, electronics, steel, and machinery.",
    connections: [
      { targetId: "product_semiconductors", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_electronics", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_steel", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "corridor_malacca", relationship: "routes_through", strategicWeight: "High" },
    ],
  },
  {
    id: "country_japan",
    type: "country",
    label: "Japan",
    aliases: ["japan", "tokyo"],
    description: "Supplier of machinery, automotive components, and electronics.",
    connections: [
      { targetId: "product_machinery", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_electronics", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "product_steel", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "corridor_malacca", relationship: "routes_through", strategicWeight: "High" },
    ],
  },
  {
    id: "country_australia",
    type: "country",
    label: "Australia",
    aliases: ["australia", "canberra"],
    description: "Major supplier of coal, LNG, and critical minerals.",
    connections: [
      { targetId: "product_coal", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_lng", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_lithium", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_rare_earths", relationship: "supplies", strategicWeight: "Medium" },
    ],
  },
  {
    id: "country_indonesia",
    type: "country",
    label: "Indonesia",
    aliases: ["indonesia", "jakarta"],
    description: "Major supplier of palm oil, coal, nickel, and rubber.",
    connections: [
      { targetId: "product_palm_oil", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "product_coal", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_nickel", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_rubber", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "corridor_malacca", relationship: "routes_through", strategicWeight: "High" },
    ],
  },
  {
    id: "country_malaysia",
    type: "country",
    label: "Malaysia",
    aliases: ["malaysia", "kuala lumpur"],
    description: "Supplier of palm oil, LNG, electronics, and rubber.",
    connections: [
      { targetId: "product_palm_oil", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_lng", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "product_electronics", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "product_rubber", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "corridor_malacca", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_vietnam",
    type: "country",
    label: "Vietnam",
    aliases: ["vietnam", "hanoi"],
    description: "Emerging alternative supplier for electronics and textiles.",
    connections: [
      { targetId: "product_electronics", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "corridor_malacca", relationship: "routes_through", strategicWeight: "High" },
    ],
  },
  {
    id: "country_nigeria",
    type: "country",
    label: "Nigeria",
    aliases: ["nigeria", "abuja", "lagos"],
    description: "African oil supplier to India.",
    connections: [
      { targetId: "product_crude_oil", relationship: "supplies", strategicWeight: "Medium" },
    ],
  },
  {
    id: "country_canada",
    type: "country",
    label: "Canada",
    aliases: ["canada", "ottawa"],
    description: "Potential supplier of potash fertilizers and critical minerals.",
    connections: [
      { targetId: "product_fertilizers", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "product_lithium", relationship: "supplies", strategicWeight: "Medium" },
    ],
  },
  {
    id: "country_morocco",
    type: "country",
    label: "Morocco",
    aliases: ["morocco", "rabat"],
    description: "World's largest phosphate producer; alternative fertilizer source.",
    connections: [
      { targetId: "product_fertilizers", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "country_belarus",
    type: "country",
    label: "Belarus",
    aliases: ["belarus", "minsk"],
    description: "Major potash exporter; sanctions affect supply.",
    connections: [
      { targetId: "product_fertilizers", relationship: "supplies", strategicWeight: "Medium" },
    ],
  },
  {
    id: "country_ukraine",
    type: "country",
    label: "Ukraine",
    aliases: ["ukraine", "kyiv", "kiev"],
    description: "Supplier of sunflower oil and food grains; conflict disrupts Black Sea trade.",
    connections: [
      { targetId: "product_edible_oil", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_food_grains", relationship: "supplies", strategicWeight: "High" },
      { targetId: "corridor_black_sea", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_turkey",
    type: "country",
    label: "Turkey",
    aliases: ["turkey", "türkiye", "turkiye", "ankara", "istanbul"],
    description: "Controls Bosphorus strait; supplier of steel and industrial goods.",
    connections: [
      { targetId: "product_steel", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "corridor_black_sea", relationship: "routes_through", strategicWeight: "High" },
    ],
  },
  {
    id: "country_egypt",
    type: "country",
    label: "Egypt",
    aliases: ["egypt", "cairo"],
    description: "Controls the Suez Canal.",
    connections: [
      { targetId: "corridor_suez", relationship: "threatens", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_singapore",
    type: "country",
    label: "Singapore",
    aliases: ["singapore"],
    description: "World's 2nd busiest container port; critical transshipment hub for India.",
    connections: [
      { targetId: "corridor_malacca", relationship: "routes_through", strategicWeight: "Critical" },
      { targetId: "port_chennai", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "port_vizag", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "port_kochi", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "country_europe",
    type: "country",
    label: "Europe",
    aliases: ["eu", "european union", "germany", "france", "uk", "britain", "european"],
    description: "Trading partner for machinery, chemicals, and manufactured goods.",
    connections: [
      { targetId: "product_machinery", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_industrial_chemicals", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "corridor_suez", relationship: "routes_through", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_chile",
    type: "country",
    label: "Chile",
    aliases: ["chile", "santiago"],
    description: "Major copper and lithium producer.",
    connections: [
      { targetId: "product_copper", relationship: "supplies", strategicWeight: "High" },
      { targetId: "product_lithium", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "country_drc",
    type: "country",
    label: "Democratic Republic of Congo",
    aliases: ["drc", "congo", "kinshasa"],
    description: "Supplies ~70% of global cobalt.",
    connections: [
      { targetId: "product_cobalt", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "country_india",
    type: "country",
    label: "India",
    aliases: ["india", "new delhi", "delhi", "indian"],
    description: "Primary import destination — the focal point of all analysis.",
    connections: [
      { targetId: "industry_refining", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "industry_automotive", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "industry_pharmaceuticals", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "industry_electronics", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "industry_agriculture", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "industry_power", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "industry_defence", relationship: "depends_on", strategicWeight: "Critical" },
    ],
  },

  // =========================================================================
  // INDIAN PORTS
  // =========================================================================
  {
    id: "port_jnpt",
    type: "port",
    label: "JNPT (Nhava Sheva)",
    aliases: ["jnpt", "nhava sheva", "navi mumbai port"],
    description: "India's largest container port, west coast (Maharashtra).",
    // ── Capacity metadata ──
    capacityMtpa: 78,           // 7.8M TEU × ~10 MT per TEU equiv; JNPort Annual Report 2023-24
    baseUtilizationPct: 84,
    bufferDays: 5,
    flexibilityFactor: 0.55,
    dataSource: "Jawaharlal Nehru Port Authority Annual Report 2023-24; IMF PortWatch",
    connections: [
      { targetId: "corridor_suez", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "corridor_hormuz", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "industry_manufacturing", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "port_mundra",
    type: "port",
    label: "Mundra Port",
    aliases: ["mundra", "adani port"],
    description: "India's largest private port (Gujarat); major oil/gas/container terminal.",
    // ── Capacity metadata ──
    capacityMtpa: 210,          // 210 MT rated capacity; Adani Ports Annual Report 2023-24
    baseUtilizationPct: 74,
    bufferDays: 4,
    flexibilityFactor: 0.40,    // Significant contracted crude crude volumes
    dataSource: "Adani Ports & SEZ Annual Report 2023-24; Ministry of Ports, Shipping & Waterways",
    connections: [
      { targetId: "corridor_hormuz", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "corridor_suez", relationship: "depends_on", strategicWeight: "High" },
      { targetId: "infra_refineries_west", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "port_kandla",
    type: "port",
    label: "Kandla / Deendayal Port",
    aliases: ["kandla", "deendayal port", "deendayal"],
    description: "Major bulk cargo port in Gujarat; handles oil, fertilizers, grains.",
    // ── Capacity metadata ──
    capacityMtpa: 140,          // 140 MT; Deendayal Port Authority Annual Report 2023-24
    baseUtilizationPct: 79,
    bufferDays: 5,
    flexibilityFactor: 0.35,
    dataSource: "Deendayal Port Authority Annual Report 2023-24; Ministry of Ports, Shipping & Waterways",
    connections: [
      { targetId: "corridor_hormuz", relationship: "depends_on", strategicWeight: "High" },
      { targetId: "infra_fertilizer_plants", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "port_chennai",
    type: "port",
    label: "Chennai Port",
    aliases: ["chennai port"],
    description: "Major port on east coast; automotive and electronics hub.",
    // ── Capacity metadata ──
    capacityMtpa: 65,           // 65 MT; Chennai Port Trust Annual Report 2023-24
    baseUtilizationPct: 70,
    bufferDays: 6,
    flexibilityFactor: 0.50,
    dataSource: "Chennai Port Authority Annual Report 2023-24; IMF PortWatch",
    connections: [
      { targetId: "corridor_malacca", relationship: "depends_on", strategicWeight: "Critical" },
      { targetId: "infra_electronics_tn", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_automotive", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "port_vizag",
    type: "port",
    label: "Visakhapatnam (Vizag) Port",
    aliases: ["vizag", "visakhapatnam"],
    description: "Major east coast port; steel and industrial cargo.",
    // ── Capacity metadata ──
    capacityMtpa: 100,          // CITED: 100 MT cargo handled FY2023-24; Visakhapatnam Port Authority Annual Report 2023-24
    baseUtilizationPct: 71,    // CITED: ~71 MT actual vs 100 MT capacity; VPA AR 2023-24
    bufferDays: 5,             // ANALYST_ESTIMATE: east-coast inventory buffer; industry norm
    flexibilityFactor: 0.45,   // ANALYST_ESTIMATE: significant spot/tramp coal traffic
    dataSource: "CITED: Visakhapatnam Port Authority Annual Report 2023-24 (capacity and throughput); bufferDays and flexibilityFactor are analyst estimates",
    connections: [
      { targetId: "corridor_malacca", relationship: "depends_on", strategicWeight: "High" },
      { targetId: "industry_steel", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "port_kochi",
    type: "port",
    label: "Kochi Port",
    aliases: ["kochi", "cochin"],
    description: "Major west coast port on Arabian Sea (Kerala).",
    // ── Capacity metadata ──
    capacityMtpa: 65,           // 65 MT; Cochin Port Authority Annual Report 2023-24
    baseUtilizationPct: 66,
    bufferDays: 4,
    flexibilityFactor: 0.45,
    dataSource: "Cochin Port Authority Annual Report 2023-24; Ministry of Ports, Shipping & Waterways",
    connections: [
      { targetId: "corridor_suez", relationship: "depends_on", strategicWeight: "High" },
      { targetId: "corridor_hormuz", relationship: "depends_on", strategicWeight: "Medium" },
      { targetId: "infra_refineries_south", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "port_kolkata",
    type: "port",
    label: "Kolkata / Haldia Port",
    aliases: ["kolkata port", "haldia", "calcutta port"],
    description: "Major east coast port; serves eastern industrial belt.",
    // ── Capacity metadata ──
    capacityMtpa: 90,           // CITED: combined Kolkata + Haldia ~90 MT capacity; Syama Prasad Mookerjee Port AR 2023-24
    baseUtilizationPct: 64,    // CITED: ~58 MT actual throughput FY2023-24; SMPK AR 2023-24
    bufferDays: 5,             // ANALYST_ESTIMATE
    flexibilityFactor: 0.40,   // ANALYST_ESTIMATE: mixed bulk + container; moderate spot share
    dataSource: "CITED: Syama Prasad Mookerjee Port Trust Annual Report 2023-24; bufferDays and flexibilityFactor are analyst estimates",
    connections: [
      { targetId: "corridor_malacca", relationship: "depends_on", strategicWeight: "High" },
      { targetId: "industry_manufacturing", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "port_paradip",
    type: "port",
    label: "Paradip Port",
    aliases: ["paradip", "paradeep"],
    description: "Major east coast bulk cargo port (Odisha); handles coal, oil, fertilizers.",
    connections: [
      { targetId: "corridor_malacca", relationship: "depends_on", strategicWeight: "Medium" },
      { targetId: "infra_refineries_east", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "port_mangalore",
    type: "port",
    label: "New Mangalore Port (NMPT)",
    aliases: ["mangalore port", "nmpt", "mangalore"],
    description: "West coast port handling crude oil and LPG imports.",
    // ── Capacity metadata ──
    capacityMtpa: 44,           // CITED: 44 MT rated capacity; NMPT Annual Report 2023-24
    baseUtilizationPct: 90,    // CITED: ~39 MT actual FY2023-24; NMPT AR 2023-24 (high utilisation crude terminal)
    bufferDays: 3,             // ANALYST_ESTIMATE: crude oil port with direct refinery pipeline; low buffer
    flexibilityFactor: 0.20,   // ANALYST_ESTIMATE: highly contracted crude supply; minimal spot
    dataSource: "CITED: New Mangalore Port Trust Annual Report 2023-24; bufferDays and flexibilityFactor are analyst estimates",
    connections: [
      { targetId: "corridor_hormuz", relationship: "depends_on", strategicWeight: "High" },
      { targetId: "infra_refineries_south", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "port_tuticorin",
    type: "port",
    label: "Tuticorin (V.O. Chidambaranar) Port",
    aliases: ["tuticorin", "thoothukudi"],
    description: "South coast port handling coal, salt, and containers.",
    connections: [
      { targetId: "industry_power", relationship: "feeds_into", strategicWeight: "Medium" },
    ],
  },
  {
    id: "port_ennore",
    type: "port",
    label: "Ennore (Kamarajar) Port",
    aliases: ["ennore", "kamarajar port"],
    description: "Coal and LNG import terminal near Chennai.",
    // ── Capacity metadata ──
    capacityMtpa: 66,           // CITED: 66 MT rated capacity; Kamarajar Port Limited AR 2023-24
    baseUtilizationPct: 55,    // CITED: ~36 MT actual FY2023-24; KPL AR 2023-24
    bufferDays: 4,             // ANALYST_ESTIMATE: coal stockpile buffer at power plants downstream
    flexibilityFactor: 0.35,   // ANALYST_ESTIMATE: coal is partially spot-traded; LNG is fully contracted
    dataSource: "CITED: Kamarajar Port Limited Annual Report 2023-24; bufferDays and flexibilityFactor are analyst estimates",
    connections: [
      { targetId: "corridor_malacca", relationship: "depends_on", strategicWeight: "High" },
      { targetId: "infra_power_grid", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },

  // =========================================================================
  // PRODUCTS / COMMODITIES
  // =========================================================================
  {
    id: "product_crude_oil",
    type: "product",
    label: "Crude Oil",
    aliases: ["crude oil", "petroleum", "crude", "oil imports", "brent", "wti"],
    description: "India imports ~85% of crude oil requirements.",
    // ── Supply chain resilience metadata ──
    bufferDays: 14,          // ANALYST_ESTIMATE: ~14 days crude in commercial + pipeline inventory; directionally consistent with MoPNG reporting but not verified from a specific document
    flexibilityFactor: 0.30, // ANALYST_ESTIMATE: rough split between spot and long-term crude contracts; not verified from PPAC
    dataSource: "ANALYST_ESTIMATE — not verified from a specific document. Directionally consistent with MoPNG/PPAC reporting patterns.",
    connections: [
      { targetId: "category_energy", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_refining", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "infra_refineries_west", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "infra_refineries_east", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "infra_refineries_south", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_lng",
    type: "product",
    label: "Liquefied Natural Gas (LNG)",
    aliases: ["lng", "natural gas", "liquefied natural gas"],
    description: "India is the 4th largest LNG importer globally.",
    // ── Supply chain resilience metadata ──
    bufferDays: 7,           // ANALYST_ESTIMATE: ~7 days LNG in regasification terminal storage; not verified from a specific PNGRB document
    flexibilityFactor: 0.20, // ANALYST_ESTIMATE: rough long-term vs spot LNG split; not verified from Petronet filings
    dataSource: "ANALYST_ESTIMATE — not verified from a specific document. Directionally consistent with PNGRB/Petronet LNG reporting.",
    connections: [
      { targetId: "category_energy", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_power", relationship: "supplies", strategicWeight: "High" },
      { targetId: "industry_chemicals", relationship: "supplies", strategicWeight: "Medium" },
      { targetId: "infra_power_grid", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "product_lpg",
    type: "product",
    label: "Liquefied Petroleum Gas (LPG)",
    aliases: ["lpg", "cooking gas"],
    description: "Critical household fuel; India is world's 2nd largest LPG consumer.",
    connections: [
      { targetId: "category_energy", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "product_coal",
    type: "product",
    label: "Coal",
    aliases: ["coal", "thermal coal", "coking coal", "metallurgical coal"],
    description: "India's power generation and steel production depend on coal imports.",
    // ── Supply chain resilience metadata ──
    bufferDays: 25,          // PARTIALLY_VERIFIED: CEA does publish daily coal stock reports and ~20-30 day buffers at thermal power plants are consistently reported; specific figure not pulled from a single document
    flexibilityFactor: 0.55, // ANALYST_ESTIMATE: coal has high spot/tender share but exact figure not verified
    dataSource: "PARTIALLY_VERIFIED — CEA daily coal stock reports consistently show 20-30 day thermal buffer; flexibilityFactor is analyst estimate",
    connections: [
      { targetId: "category_energy", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_power", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "industry_steel", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "infra_power_grid", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_semiconductors",
    type: "product",
    label: "Semiconductors",
    aliases: ["semiconductor", "semiconductors", "chip", "chips", "integrated circuit", "ic"],
    description: "Critical for electronics, automotive, defence, and telecom.",
    // ── Supply chain resilience metadata ──
    bufferDays: 21,          // ANALYST_ESTIMATE: typical chip inventory weeks for Indian electronics manufacturers; not verified from IESA survey documents
    flexibilityFactor: 0.25, // ANALYST_ESTIMATE: Taiwan/Korea concentration estimate; not verified from MeitY documents
    dataSource: "ANALYST_ESTIMATE — not verified from IESA or MeitY documents. Based on general semiconductor supply chain knowledge.",
    connections: [
      { targetId: "category_electronics_semi", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_electronics", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "industry_automotive", relationship: "supplies", strategicWeight: "High" },
      { targetId: "industry_defence", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_rare_earths",
    type: "product",
    label: "Rare Earth Minerals",
    aliases: ["rare earth", "rare earths", "neodymium", "dysprosium", "terbium", "gallium", "germanium"],
    description: "Essential for EV motors, wind turbines, defence electronics.",
    connections: [
      { targetId: "category_minerals", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_electronics", relationship: "supplies", strategicWeight: "High" },
      { targetId: "industry_defence", relationship: "supplies", strategicWeight: "High" },
      { targetId: "industry_renewable_energy", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_apis",
    type: "product",
    label: "Pharmaceutical APIs",
    aliases: ["api", "apis", "active pharmaceutical ingredient", "pharmaceutical ingredient", "drug ingredient", "paracetamol", "ibuprofen"],
    description: "India imports ~68% of APIs from China.",
    // ── Supply chain resilience metadata ──
    bufferDays: 30,          // ANALYST_ESTIMATE: post-COVID pharma inventory norms; not verified from IPA survey documents
    flexibilityFactor: 0.15, // ANALYST_ESTIMATE: China API concentration estimate; 68% China dependency is a cited figure but the flexibility fraction is my estimate
    dataSource: "ANALYST_ESTIMATE — 68% China API dependency is a real cited figure (FICCI/IPA); bufferDays and flexibilityFactor are analyst estimates not verified from documents.",
    connections: [
      { targetId: "category_pharma", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_pharmaceuticals", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "infra_pharma_clusters", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_fertilizers",
    type: "product",
    label: "Fertilizers",
    aliases: ["fertilizer", "fertilizers", "urea", "potash", "dap", "phosphate", "nitrogen fertilizer"],
    description: "Critical for food security; India imports significant quantities.",
    // ── Supply chain resilience metadata ──
    bufferDays: 45,          // PARTIALLY_VERIFIED: DoF buffer stock policy norm of ~45 days is widely cited in government documents; specific figure confirmed in spirit if not from a single retrievable URL
    flexibilityFactor: 0.40, // ANALYST_ESTIMATE: diversified sourcing estimate; not verified from FAI statistics
    dataSource: "PARTIALLY_VERIFIED — DoF 45-day fertilizer buffer norm is a cited policy figure; flexibilityFactor is analyst estimate",
    connections: [
      { targetId: "category_agri", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_agriculture", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "infra_fertilizer_plants", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_electronics",
    type: "product",
    label: "Electronics & Components",
    aliases: ["electronics", "electronic components", "pcb", "display", "battery"],
    description: "India imports electronics worth $80B+ annually.",
    // ── Supply chain resilience metadata ──
    bufferDays: 14,          // ANALYST_ESTIMATE: typical electronics component inventory; not verified from ELCINA survey documents
    flexibilityFactor: 0.35, // ANALYST_ESTIMATE: China dependency estimate; not verified from MeitY PLI documents
    dataSource: "ANALYST_ESTIMATE — not verified from ELCINA or MeitY PLI documents.",
    connections: [
      { targetId: "category_electronics_semi", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_electronics", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "infra_electronics_tn", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "infra_electronics_noida", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "product_steel",
    type: "product",
    label: "Steel",
    aliases: ["steel", "iron", "iron ore", "stainless steel"],
    description: "India imports specialty steel grades.",
    connections: [
      { targetId: "category_minerals", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_steel", relationship: "supplies", strategicWeight: "Critical" },
      { targetId: "industry_construction", relationship: "supplies", strategicWeight: "High" },
      { targetId: "industry_automotive", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_copper",
    type: "product",
    label: "Copper",
    aliases: ["copper"],
    description: "Critical for electrical infrastructure and construction.",
    connections: [
      { targetId: "category_minerals", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_construction", relationship: "supplies", strategicWeight: "High" },
      { targetId: "industry_electronics", relationship: "supplies", strategicWeight: "Medium" },
    ],
  },
  {
    id: "product_lithium",
    type: "product",
    label: "Lithium",
    aliases: ["lithium", "lithium-ion"],
    description: "Essential for EV batteries and energy storage.",
    connections: [
      { targetId: "category_minerals", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_automotive", relationship: "supplies", strategicWeight: "High" },
      { targetId: "industry_renewable_energy", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_cobalt",
    type: "product",
    label: "Cobalt",
    aliases: ["cobalt"],
    description: "Critical for battery cathodes and superalloys.",
    connections: [
      { targetId: "category_minerals", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_automotive", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_nickel",
    type: "product",
    label: "Nickel",
    aliases: ["nickel"],
    description: "Used in stainless steel and EV battery cathodes.",
    connections: [
      { targetId: "category_minerals", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_steel", relationship: "supplies", strategicWeight: "Medium" },
    ],
  },
  {
    id: "product_palm_oil",
    type: "product",
    label: "Palm Oil",
    aliases: ["palm oil", "crude palm oil", "cpo"],
    description: "India is the world's largest palm oil importer.",
    // ── Supply chain resilience metadata ──
    bufferDays: 20,          // ANALYST_ESTIMATE: import pipeline stock estimate; not verified from SEA India documents
    flexibilityFactor: 0.45, // ANALYST_ESTIMATE: soybean/sunflower substitution estimate; not verified
    dataSource: "ANALYST_ESTIMATE — not verified from SEA India documents.",
    connections: [
      { targetId: "category_agri", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_food_processing", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_edible_oil",
    type: "product",
    label: "Edible Oil",
    aliases: ["edible oil", "sunflower oil", "soybean oil", "vegetable oil", "cooking oil"],
    description: "India imports ~60% of edible oil requirements.",
    // ── Supply chain resilience metadata ──
    bufferDays: 18,          // ANALYST_ESTIMATE: import pipeline stock estimate; not verified from SEA India documents
    flexibilityFactor: 0.50, // ANALYST_ESTIMATE: multi-source substitution estimate; not verified
    dataSource: "ANALYST_ESTIMATE — not verified from SEA India documents.",
    connections: [
      { targetId: "category_agri", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_food_processing", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_food_grains",
    type: "product",
    label: "Food Grains",
    aliases: ["wheat", "grain", "food grains", "pulses", "lentils"],
    description: "Strategic food security imports.",
    connections: [
      { targetId: "category_agri", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_food_processing", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_machinery",
    type: "product",
    label: "Industrial Machinery",
    aliases: ["machinery", "machine tools", "capital goods", "industrial equipment"],
    description: "Capital goods imports for manufacturing.",
    connections: [
      { targetId: "category_industrial", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_manufacturing", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "product_defence_equipment",
    type: "product",
    label: "Defence Equipment",
    aliases: ["defence equipment", "defense equipment", "military equipment", "weapons", "arms"],
    description: "India is one of the world's largest defence importers.",
    connections: [
      { targetId: "category_defence", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_defence", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_solar_panels",
    type: "product",
    label: "Solar Panels & Modules",
    aliases: ["solar panel", "solar panels", "solar module", "photovoltaic", "pv module"],
    description: "India imports ~80% of solar modules from China.",
    connections: [
      { targetId: "category_energy", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_renewable_energy", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_industrial_chemicals",
    type: "product",
    label: "Industrial Chemicals",
    aliases: ["chemicals", "industrial chemicals", "chemical"],
    description: "Key inputs for pharma, agriculture, and manufacturing.",
    connections: [
      { targetId: "category_industrial", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_chemicals", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },
  {
    id: "product_rubber",
    type: "product",
    label: "Natural Rubber",
    aliases: ["rubber", "natural rubber"],
    description: "Used in automotive and manufacturing.",
    connections: [
      { targetId: "category_industrial", relationship: "feeds_into", strategicWeight: "Medium" },
      { targetId: "industry_automotive", relationship: "supplies", strategicWeight: "Medium" },
    ],
  },
  {
    id: "product_fuel",
    type: "product",
    label: "Refined Petroleum Products",
    aliases: ["fuel", "diesel", "petrol", "gasoline", "kerosene", "jet fuel"],
    description: "Refined products from Indian refineries.",
    connections: [
      { targetId: "industry_transportation", relationship: "supplies", strategicWeight: "Critical" },
    ],
  },

  // =========================================================================
  // IMPORT CATEGORIES
  // =========================================================================
  {
    id: "category_energy",
    type: "category",
    label: "Energy Imports",
    aliases: ["energy imports", "energy security"],
    description: "Crude oil, LNG, LPG, coal — India's largest import category by value.",
    connections: [
      { targetId: "infra_power_grid", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "infra_refineries_west", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "category_minerals",
    type: "category",
    label: "Critical Minerals & Metals",
    aliases: ["critical minerals", "mineral imports", "metals"],
    description: "Rare earths, lithium, cobalt, copper, nickel, steel.",
    connections: [
      { targetId: "industry_electronics", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_defence", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_automotive", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "category_agri",
    type: "category",
    label: "Agricultural Inputs & Food",
    aliases: ["agricultural imports", "food imports", "agri inputs"],
    description: "Fertilizers, edible oils, pulses, food grains.",
    connections: [
      { targetId: "industry_agriculture", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "industry_food_processing", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "category_pharma",
    type: "category",
    label: "Pharmaceutical Inputs",
    aliases: ["pharma imports", "pharmaceutical imports"],
    description: "APIs and key starting materials for India's pharma sector.",
    connections: [
      { targetId: "industry_pharmaceuticals", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "infra_pharma_clusters", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "category_electronics_semi",
    type: "category",
    label: "Electronics & Semiconductors",
    aliases: ["electronics imports", "semiconductor imports"],
    description: "Chips, displays, PCBs, electronic components.",
    connections: [
      { targetId: "industry_electronics", relationship: "feeds_into", strategicWeight: "Critical" },
      { targetId: "infra_electronics_tn", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "infra_electronics_noida", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "category_defence",
    type: "category",
    label: "Defence & Strategic",
    aliases: ["defence imports", "defense imports", "strategic imports"],
    description: "Military hardware, equipment, and strategic materials.",
    connections: [
      { targetId: "industry_defence", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "category_industrial",
    type: "category",
    label: "Industrial Chemicals & Machinery",
    aliases: ["industrial imports"],
    description: "Chemical feedstock, machinery, and capital goods.",
    connections: [
      { targetId: "industry_chemicals", relationship: "feeds_into", strategicWeight: "High" },
      { targetId: "industry_manufacturing", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },

  // =========================================================================
  // INDUSTRIES
  // =========================================================================
  {
    id: "industry_refining",
    type: "industry",
    label: "Petroleum Refining",
    aliases: ["refinery", "refineries", "refining"],
    description: "Transforms crude oil into fuel, petrochemicals, LPG.",
    connections: [
      { targetId: "product_fuel", relationship: "produces", strategicWeight: "Critical" },
    ],
  },
  {
    id: "industry_pharmaceuticals",
    type: "industry",
    label: "Pharmaceuticals",
    aliases: ["pharma", "pharmaceuticals", "drug manufacturing"],
    description: "India is 'pharmacy of the world'; depends on imported APIs.",
    connections: [],
  },
  {
    id: "industry_electronics",
    type: "industry",
    label: "Electronics Manufacturing",
    aliases: ["electronics manufacturing", "electronics assembly"],
    description: "Mobile phones, consumer electronics, industrial electronics.",
    connections: [],
  },
  {
    id: "industry_automotive",
    type: "industry",
    label: "Automotive",
    aliases: ["automotive", "automobile", "auto", "ev", "electric vehicle"],
    description: "India's 3rd largest auto market; growing EV segment.",
    connections: [],
  },
  {
    id: "industry_agriculture",
    type: "industry",
    label: "Agriculture",
    aliases: ["agriculture", "farming"],
    description: "Employs ~42% of India's workforce; depends on imported fertilizers.",
    connections: [],
  },
  {
    id: "industry_power",
    type: "industry",
    label: "Power Generation",
    aliases: ["power generation", "electricity", "power sector"],
    description: "Coal and gas-fired generation; growing renewables.",
    connections: [
      { targetId: "infra_power_grid", relationship: "feeds_into", strategicWeight: "Critical" },
    ],
  },
  {
    id: "industry_steel",
    type: "industry",
    label: "Steel Production",
    aliases: ["steel production", "steel manufacturing", "steelmaking"],
    description: "India is world's 2nd largest steel producer; imports coking coal.",
    connections: [
      { targetId: "industry_construction", relationship: "supplies", strategicWeight: "High" },
    ],
  },
  {
    id: "industry_defence",
    type: "industry",
    label: "Defence & Aerospace",
    aliases: ["defence", "defense", "aerospace", "military industry"],
    description: "National security manufacturing and procurement.",
    connections: [],
  },
  {
    id: "industry_chemicals",
    type: "industry",
    label: "Chemicals & Petrochemicals",
    aliases: ["chemicals", "petrochemicals", "chemical industry"],
    description: "Feedstock for pharma, agriculture, and manufacturing.",
    connections: [],
  },
  {
    id: "industry_food_processing",
    type: "industry",
    label: "Food Processing",
    aliases: ["food processing", "fmcg", "food industry"],
    description: "Processes imported edible oils, grains, and ingredients.",
    connections: [],
  },
  {
    id: "industry_renewable_energy",
    type: "industry",
    label: "Renewable Energy",
    aliases: ["renewable energy", "solar energy", "wind energy", "green energy"],
    description: "India targets 500 GW renewable capacity by 2030.",
    connections: [],
  },
  {
    id: "industry_construction",
    type: "industry",
    label: "Construction & Infrastructure",
    aliases: ["construction", "infrastructure", "real estate"],
    description: "Major consumer of steel, copper, and cement.",
    connections: [],
  },
  {
    id: "industry_textiles",
    type: "industry",
    label: "Textiles & Apparel",
    aliases: ["textiles", "apparel", "garment", "cotton"],
    description: "Significant exporter but imports synthetic fibers and machinery.",
    connections: [],
  },
  {
    id: "industry_transportation",
    type: "industry",
    label: "Transportation & Logistics",
    aliases: ["transportation", "logistics", "shipping", "freight"],
    description: "Movement of goods; directly impacted by fuel costs and shipping disruptions.",
    connections: [],
  },
  {
    id: "industry_manufacturing",
    type: "industry",
    label: "General Manufacturing",
    aliases: ["manufacturing", "make in india"],
    description: "Broad manufacturing base dependent on imported machinery and materials.",
    connections: [],
  },

  // =========================================================================
  // CRITICAL INFRASTRUCTURE
  // =========================================================================
  {
    id: "infra_refineries_west",
    type: "infrastructure",
    label: "West Coast Refineries (Jamnagar, MRPL, BPCL Mumbai)",
    aliases: ["jamnagar refinery", "reliance refinery", "mrpl"],
    description: "India's largest refining cluster; fed by Gulf crude via Hormuz.",
    // ── Capacity metadata ──
    capacityMtpa: 115,          // Reliance (68.2) + MRPL (15) + BPCL Mumbai (12) + others ~20 Mtpa
    baseUtilizationPct: 105,    // Indian refineries run above nameplate (operational excellence)
    bufferDays: 21,             // ~21 days crude tankage at typical inventory levels
    flexibilityFactor: 0.30,    // Crude diet flexibility constrained by refinery configuration
    dataSource: "Ministry of Petroleum & Natural Gas, Indian Petroleum & Natural Gas Statistics 2022-23; PPAC",
    connections: [
      { targetId: "product_fuel", relationship: "produces", strategicWeight: "Critical" },
      { targetId: "infra_power_grid", relationship: "feeds_into", strategicWeight: "High" },
    ],
  },
  {
    id: "infra_refineries_east",
    type: "infrastructure",
    label: "East Coast Refineries (Paradip, Haldia, Vizag)",
    aliases: ["paradip refinery", "haldia refinery", "vizag refinery"],
    description: "Refineries serving eastern India; receive crude from multiple sources.",
    // ── Capacity metadata ──
    capacityMtpa: 45,           // IOC Paradip (15.5) + Haldia (7.5) + HPCL Vizag (8.3) + others
    baseUtilizationPct: 98,
    bufferDays: 18,
    flexibilityFactor: 0.45,    // Can switch from Gulf to Russian/US crude more easily
    dataSource: "Ministry of Petroleum & Natural Gas, Indian Petroleum & Natural Gas Statistics 2022-23; PPAC",
    connections: [
      { targetId: "product_fuel", relationship: "produces", strategicWeight: "High" },
    ],
  },
  {
    id: "infra_refineries_south",
    type: "infrastructure",
    label: "South India Refineries (Kochi, Mangalore, Chennai Petroleum)",
    aliases: ["kochi refinery", "mangalore refinery", "chennai petroleum"],
    description: "Refineries on southern coast.",
    // ── Capacity metadata ──
    capacityMtpa: 30,           // BPCL Kochi (15.5) + MRPL Mangalore (a/c above) + CPCL (10.5)
    baseUtilizationPct: 92,
    bufferDays: 15,
    flexibilityFactor: 0.40,
    dataSource: "Ministry of Petroleum & Natural Gas, Indian Petroleum & Natural Gas Statistics 2022-23; PPAC",
    connections: [
      { targetId: "product_fuel", relationship: "produces", strategicWeight: "High" },
    ],
  },
  {
    id: "infra_power_grid",
    type: "infrastructure",
    label: "National Power Grid",
    aliases: ["power grid", "electricity grid", "national grid"],
    description: "India's interconnected power generation and distribution system.",
    connections: [],
  },
  {
    id: "infra_fertilizer_plants",
    type: "infrastructure",
    label: "Fertilizer Manufacturing Plants",
    aliases: ["fertilizer plant", "urea plant", "iffco"],
    description: "Domestic fertilizer production depends on imported feedstock.",
    // ── Capacity metadata ──
    // Fertilizer plants are infrastructure, not a throughput corridor.
    // capacityMtpa here represents urea production capacity, not port tonnage.
    capacityMtpa: 28,           // CITED: India's total urea production capacity ~28 MT/yr; FAI Fertiliser Statistics 2022-23
    baseUtilizationPct: 92,    // CITED: ~25.8 MT actual production FY2022-23; FAI 2022-23 (high utilisation)
    bufferDays: 45,            // ANALYST_ESTIMATE: seasonal inventory buffer pre-Kharif/Rabi seasons;
                               //   DoF (Dept of Fertilisers) maintains ~45-day strategic buffer norm
    flexibilityFactor: 0.15,   // ANALYST_ESTIMATE: feedstock (natural gas, phosphate) is largely
                               //   contracted; substitution is slow (weeks, not days)
    dataSource: "CITED: Fertiliser Association of India Statistics 2022-23 (production capacity and utilisation); bufferDays from DoF strategic buffer norms; flexibilityFactor is analyst estimate",
    // ENGINE SIGNAL: output loss formula applies — not the transit spare-capacity formula.
    capacityType: "production_output",
    connections: [],
  },
  {
    id: "infra_pharma_clusters",
    type: "infrastructure",
    label: "Pharmaceutical Manufacturing Clusters (Hyderabad, Ahmedabad, Mumbai)",
    aliases: ["pharma cluster", "hyderabad pharma", "bulk drug park"],
    description: "India's API formulation and drug manufacturing hubs.",
    connections: [],
  },
  {
    id: "infra_electronics_tn",
    type: "infrastructure",
    label: "Electronics Assembly Zone (Tamil Nadu / Sriperumbudur)",
    aliases: ["sriperumbudur", "foxconn india", "tamil nadu electronics"],
    description: "Major electronics and mobile phone assembly corridor.",
    connections: [],
  },
  {
    id: "infra_electronics_noida",
    type: "infrastructure",
    label: "Electronics Assembly Zone (Noida / Greater Noida)",
    aliases: ["noida electronics", "greater noida"],
    description: "NCR electronics manufacturing hub.",
    connections: [],
  },
];

// =========================================================================
// ALTERNATIVE SUPPLIER MAPPINGS
// Maps: disrupted product → alternative source countries
// =========================================================================
export type AlternativeSupplierMapping = {
  productId: string;
  productLabel: string;
  alternatives: Array<{
    countryId: string;
    countryLabel: string;
    viability: "Established" | "Developing" | "Potential";
    notes: string;
  }>;
};

export const ALTERNATIVE_SUPPLIERS: AlternativeSupplierMapping[] = [
  {
    productId: "product_crude_oil",
    productLabel: "Crude Oil",
    alternatives: [
      { countryId: "country_russia", countryLabel: "Russia", viability: "Established", notes: "Discounted Urals crude; payment routing complexities" },
      { countryId: "country_usa", countryLabel: "United States", viability: "Established", notes: "Shale oil; higher shipping cost" },
      { countryId: "country_nigeria", countryLabel: "Nigeria", viability: "Established", notes: "Bonny Light grade; longer transit" },
      { countryId: "country_iraq", countryLabel: "Iraq", viability: "Established", notes: "Basra crude; same corridor risk via Hormuz" },
    ],
  },
  {
    productId: "product_lng",
    productLabel: "LNG",
    alternatives: [
      { countryId: "country_usa", countryLabel: "United States", viability: "Established", notes: "Long-term contracts via Sabine Pass" },
      { countryId: "country_australia", countryLabel: "Australia", viability: "Established", notes: "Gorgon and Ichthys projects" },
      { countryId: "country_oman", countryLabel: "Oman", viability: "Established", notes: "Shorter transit" },
      { countryId: "country_malaysia", countryLabel: "Malaysia", viability: "Developing", notes: "PETRONAS LNG" },
    ],
  },
  {
    productId: "product_coal",
    productLabel: "Coal",
    alternatives: [
      { countryId: "country_australia", countryLabel: "Australia", viability: "Established", notes: "Premium coking coal from Queensland" },
      { countryId: "country_indonesia", countryLabel: "Indonesia", viability: "Established", notes: "Thermal coal; proximity advantage" },
      { countryId: "country_russia", countryLabel: "Russia", viability: "Developing", notes: "Far East coal; logistics challenges" },
    ],
  },
  {
    productId: "product_semiconductors",
    productLabel: "Semiconductors",
    alternatives: [
      { countryId: "country_south_korea", countryLabel: "South Korea", viability: "Established", notes: "Samsung foundries" },
      { countryId: "country_japan", countryLabel: "Japan", viability: "Established", notes: "Renesas, Sony Semiconductor" },
      { countryId: "country_usa", countryLabel: "United States", viability: "Developing", notes: "Intel, CHIPS Act expansion" },
    ],
  },
  {
    productId: "product_rare_earths",
    productLabel: "Rare Earth Minerals",
    alternatives: [
      { countryId: "country_australia", countryLabel: "Australia", viability: "Developing", notes: "Lynas Corporation" },
      { countryId: "country_canada", countryLabel: "Canada", viability: "Potential", notes: "Emerging mining projects" },
      { countryId: "country_vietnam", countryLabel: "Vietnam", viability: "Potential", notes: "Significant reserves" },
    ],
  },
  {
    productId: "product_apis",
    productLabel: "Pharmaceutical APIs",
    alternatives: [
      { countryId: "country_india", countryLabel: "India (domestic)", viability: "Developing", notes: "Bulk Drug Parks scheme; 3-5 year ramp-up" },
      { countryId: "country_europe", countryLabel: "Europe", viability: "Established", notes: "Higher cost but reliable quality" },
    ],
  },
  {
    productId: "product_fertilizers",
    productLabel: "Fertilizers",
    alternatives: [
      { countryId: "country_morocco", countryLabel: "Morocco", viability: "Established", notes: "OCP Group; world's largest phosphate exporter" },
      { countryId: "country_canada", countryLabel: "Canada", viability: "Established", notes: "Nutrien; potash supplier" },
      { countryId: "country_saudi_arabia", countryLabel: "Saudi Arabia", viability: "Developing", notes: "SABIC joint ventures" },
    ],
  },
  {
    productId: "product_palm_oil",
    productLabel: "Palm Oil",
    alternatives: [
      { countryId: "country_malaysia", countryLabel: "Malaysia", viability: "Established", notes: "2nd largest producer" },
      { countryId: "country_indonesia", countryLabel: "Indonesia", viability: "Established", notes: "Largest producer; export policy risk" },
    ],
  },
  {
    productId: "product_edible_oil",
    productLabel: "Edible Oil",
    alternatives: [
      { countryId: "country_indonesia", countryLabel: "Indonesia", viability: "Established", notes: "Palm olein" },
      { countryId: "country_ukraine", countryLabel: "Ukraine", viability: "Established", notes: "Sunflower oil; conflict risk" },
    ],
  },
  {
    productId: "product_electronics",
    productLabel: "Electronics & Components",
    alternatives: [
      { countryId: "country_vietnam", countryLabel: "Vietnam", viability: "Developing", notes: "Samsung, LG manufacturing shift" },
      { countryId: "country_south_korea", countryLabel: "South Korea", viability: "Established", notes: "Samsung, LG, SK Hynix" },
      { countryId: "country_japan", countryLabel: "Japan", viability: "Established", notes: "Premium components" },
    ],
  },
  {
    productId: "product_solar_panels",
    productLabel: "Solar Panels",
    alternatives: [
      { countryId: "country_india", countryLabel: "India (domestic)", viability: "Developing", notes: "PLI scheme for solar manufacturing" },
      { countryId: "country_vietnam", countryLabel: "Vietnam", viability: "Developing", notes: "Emerging manufacturing base" },
    ],
  },
  {
    productId: "product_steel",
    productLabel: "Steel",
    alternatives: [
      { countryId: "country_south_korea", countryLabel: "South Korea", viability: "Established", notes: "POSCO specialty steel" },
      { countryId: "country_japan", countryLabel: "Japan", viability: "Established", notes: "High-grade specialty steel" },
      { countryId: "country_turkey", countryLabel: "Turkey", viability: "Developing", notes: "Competitive pricing" },
    ],
  },
  {
    productId: "product_lithium",
    productLabel: "Lithium",
    alternatives: [
      { countryId: "country_australia", countryLabel: "Australia", viability: "Established", notes: "Spodumene mining" },
      { countryId: "country_chile", countryLabel: "Chile", viability: "Established", notes: "Brine extraction" },
      { countryId: "country_canada", countryLabel: "Canada", viability: "Potential", notes: "Emerging projects" },
    ],
  },
  {
    productId: "product_cobalt",
    productLabel: "Cobalt",
    alternatives: [
      { countryId: "country_australia", countryLabel: "Australia", viability: "Developing", notes: "Ethical sourcing" },
      { countryId: "country_canada", countryLabel: "Canada", viability: "Developing", notes: "Mining projects" },
    ],
  },
];
