const fs = require('fs');

let content = fs.readFileSync('src/features/geopolitical-intelligence/services/newsService.ts', 'utf-8');

// Update imports
content = content.replace(/import \{ DataSourceOutput, DataSourcePlugin, RawArticle \} from \"..\/types\";/, 
  `import { DataSourceOutput, DataSourcePlugin, RawArticle } from "../types";\nimport { CountryProfile } from "@/data/countries/types";`);

// Mock articles
content = content.replace(/const MOCK_ARTICLES: RawArticle\[\] = \[[\s\S]*?\];/, 
  `const MOCK_ARTICLES_INDIA: RawArticle[] = [
  {
    title: "Red Sea Houthi Attacks Force Major Shipping Reroutes Around Cape of Good Hope",
    source: "Reuters",
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    content:
      "Ongoing Houthi attacks in the Red Sea have forced major shipping lines including Maersk, MSC, and CMA CGM to reroute vessels around the Cape of Good Hope. The rerouting adds approximately 10-14 days to journey times for vessels moving between Asia and Europe. Shipping insurance premiums for the Red Sea corridor have surged significantly. India's west coast ports including JNPT and Mundra are heavily dependent on this corridor for container imports from Europe and the Mediterranean.",
    url: "https://reuters.com/mock-red-sea",
  },
  {
    title: "OPEC+ Extends Oil Production Cuts, Crude Prices Rise",
    source: "Financial Times",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    content:
      "OPEC+ members led by Saudi Arabia and Russia have agreed to extend production cuts through the next quarter. Brent crude prices have risen in response. India, which imports over 80% of its crude oil requirements, is directly exposed to this price increase. Indian refineries including Reliance Industries, HPCL, and BPCL may face increased feedstock costs. The government is closely monitoring the situation as higher crude prices could widen the current account deficit.",
    url: "https://ft.com/mock-opec",
  },
  {
    title: "US-China Semiconductor Tensions Escalate with New Export Controls",
    source: "Bloomberg",
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    content:
      "The United States has expanded semiconductor export controls targeting China, restricting advanced chip manufacturing equipment. China has responded with export restrictions on gallium and germanium, rare earth materials critical for semiconductor fabrication. India's growing electronics manufacturing sector, particularly for smartphones and automotive electronics, sources key components from both the US and Chinese supply chains. The disruption could delay India's PLI scheme targets for electronics manufacturing.",
    url: "https://bloomberg.com/mock-semi",
  },
];

const MOCK_ARTICLES_SINGAPORE: RawArticle[] = [
  {
    title: "Malacca Strait Congestion Hits Record Highs Amid Regional Naval Drills",
    source: "Reuters",
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    content:
      "Unprecedented maritime traffic and regional naval exercises have led to severe congestion in the Malacca Strait. Singapore's transshipment volumes are experiencing significant delays. As a critical node for global trade, Singapore's port operations are heavily stressed, impacting supply chains for goods moving between the Middle East, Europe, and East Asia.",
    url: "https://reuters.com/mock-malacca",
  },
  {
    title: "Global Supply Chain Realignments Increase Demand for Singapore Refineries",
    source: "Bloomberg",
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    content:
      "Disruptions in traditional oil flows have sharply increased demand for Singapore's refining capacity. The Jurong Island refinery complex is operating at peak utilization to satisfy regional demand for refined products. This strategic pressure highlights Singapore's vital role in ensuring regional energy security amidst shifting global crude supply dynamics.",
    url: "https://bloomberg.com/mock-singapore-refinery",
  }
];

function getMockArticles(country: CountryProfile): RawArticle[] {
  if (country.id === 'singapore') return MOCK_ARTICLES_SINGAPORE;
  return MOCK_ARTICLES_INDIA;
}
`);

// Add country to fetchFromNewsApi
content = content.replace(/async function fetchFromNewsApi\(\): Promise<RawArticle\[\]> \{/, 
  `async function fetchFromNewsApi(country: CountryProfile): Promise<RawArticle[]> {`);

content = content.replace(/const query = \`\\\(\\\$\{keyword\}\\\) AND \\\(India OR shipping OR supply chain OR trade\\\)\`;/, 
  `const query = \`(\${keyword}) AND (\${country.name} OR shipping OR supply chain OR trade)\`;`);

content = content.replace(/class NewsDataSourcePlugin implements DataSourcePlugin \{/, 
  `export class NewsDataSourcePlugin implements DataSourcePlugin {`);

content = content.replace(/async function getCached/, 
  `async function getCached`);

content = content.replace(/async fetch\(\): Promise<DataSourceOutput\[\]> \{/, 
  `async fetch(country: CountryProfile): Promise<DataSourceOutput[]> {`);

content = content.replace(/const fetched = await fetchFromNewsApi\(\);/, 
  `const fetched = await fetchFromNewsApi(country);`);

content = content.replace(/articles = fetched\.length > 0 \? fetched : MOCK_ARTICLES;/, 
  `const mock = getMockArticles(country);
      articles = fetched.length > 0 ? fetched : mock;`);

content = content.replace(/articles = MOCK_ARTICLES;/, 
  `const mock = getMockArticles(country);
      articles = mock;`);

content = content.replace(/unique\.some\(\(a\) => MOCK_ARTICLES\.includes\(a\)\)/, 
  `unique.some((a) => mock.includes(a))`);

// Let's also check if DataSourcePlugin type has country parameter in types/index.ts
// We'll update the type via another script if needed.
fs.writeFileSync('src/features/geopolitical-intelligence/services/newsService.ts', content);
console.log('newsService updated');
