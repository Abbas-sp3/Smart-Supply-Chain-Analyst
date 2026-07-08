/**
 * newsService.ts — News Data Source Plugin
 *
 * Responsibilities:
 * - Fetch latest India-trade-relevant news from NewsAPI
 * - Remove duplicate articles (by URL)
 * - Clean article text (strip HTML, truncate)
 * - Return normalized RawArticle objects
 *
 * If NEWS_API_KEY is not set, falls back to curated mock articles
 * so the rest of the pipeline always has data to work with.
 *
 * Implements DataSourcePlugin — future sources (AIS, commodity prices,
 * port congestion, etc.) must implement the same interface.
 */

import type { DataSourceOutput, DataSourcePlugin, RawArticle } from "../types";
import { NEWS_KEYWORDS, MAX_ARTICLES_PER_FETCH } from "../constants";

// ---------------------------------------------------------------------------
// Curated mock articles — used when NEWS_API_KEY is not set.
// Covers the most strategically important India trade intelligence topics.
// ---------------------------------------------------------------------------
const MOCK_ARTICLES: RawArticle[] = [
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
  {
    title: "Strait of Hormuz Tensions Rise Amid Iran-US Standoff",
    source: "Al Jazeera",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    content:
      "Tensions in the Strait of Hormuz have increased following naval standoffs between Iranian forces and US naval vessels in the Persian Gulf. Approximately 20% of global oil trade passes through this strategic chokepoint. India imports a significant portion of its crude oil from Gulf states including UAE, Saudi Arabia, and Iraq, all of which route through or near the Strait of Hormuz. A closure or significant disruption to this corridor could create acute energy supply challenges for Indian refineries.",
    url: "https://aljazeera.com/mock-hormuz",
  },
  {
    title: "China Restricts Rare Earth Exports, Affecting Global Supply Chains",
    source: "The Guardian",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    content:
      "China has imposed new licensing requirements on the export of rare earth minerals including neodymium, dysprosium, and terbium. China controls approximately 60% of global rare earth mining and 85% of processing capacity. These minerals are essential for electric vehicle motors, wind turbines, defense electronics, and industrial machinery. India's defense sector, nascent EV industry, and electronics manufacturing are particularly vulnerable to these restrictions.",
    url: "https://theguardian.com/mock-rare-earth",
  },
  {
    title: "India Pharmaceutical Industry Faces API Supply Disruption from China",
    source: "Economic Times",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    content:
      "Indian pharmaceutical manufacturers are facing disruptions in Active Pharmaceutical Ingredient (API) supplies from China following environmental crackdowns on chemical plants in Hubei and Shandong provinces. India imports approximately 70% of its API requirements from China. Key affected APIs include paracetamol, ibuprofen, and several antibiotic precursors. Industry bodies have warned of potential medicine shortages if alternative sources are not secured within the next quarter.",
    url: "https://economictimes.com/mock-pharma",
  },
  {
    title: "Port of Singapore Reports Record Congestion Affecting Trans-shipment",
    source: "Straits Times",
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    content:
      "The Port of Singapore, the world's second busiest container port, is experiencing severe congestion with vessel waiting times reaching record highs. The congestion is attributed to rerouting caused by Red Sea disruptions and increased Asia-Europe trade volumes. Singapore is a critical trans-shipment hub for Indian trade with Southeast Asia, Australia, and East Asia. Delays at Singapore are cascading to Indian feeder ports including Chennai, Kochi, and Vizag.",
    url: "https://straitstimes.com/mock-singapore",
  },
  {
    title: "Russia-Ukraine Conflict Disrupts Global Fertilizer and Food Supply Chains",
    source: "Reuters",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    content:
      "The ongoing Russia-Ukraine conflict continues to disrupt global supplies of fertilizers, wheat, and sunflower oil. Russia and Belarus together account for a significant share of global potash and nitrogen fertilizer exports. India, as one of the world's largest consumers of fertilizers for its agricultural sector, is exposed to these supply disruptions. The Indian government has been actively seeking alternative fertilizer suppliers from Canada, Saudi Arabia, and Morocco.",
    url: "https://reuters.com/mock-fertilizer",
  },
  {
    title: "Global Shipping Rates Surge on Multiple Simultaneous Disruptions",
    source: "Lloyd's List",
    publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    content:
      "Global container shipping rates have surged significantly due to simultaneous disruptions across multiple key shipping corridors including the Red Sea, Panama Canal drought restrictions, and port congestion at major Asian hubs. The Freightos Baltic Index shows rates on Asia-Europe routes have risen dramatically. Indian importers across sectors including electronics, machinery, chemicals, and consumer goods are facing sharply higher logistics costs, which are expected to pass through to end consumer prices.",
    url: "https://lloydslist.com/mock-rates",
  },
  {
    title: "Australia-India Critical Minerals Partnership Advances Amid China Concerns",
    source: "Mint",
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    content:
      "India and Australia have advanced their Critical Minerals Investment Partnership, targeting lithium, cobalt, nickel, and rare earth supplies from Australian mining projects. This follows India's strategic decision to reduce dependence on Chinese critical mineral processing. The partnership aims to establish a reliable supply chain for India's electric vehicle battery manufacturing ambitions and defense electronics sector. Several Indian companies have signed preliminary agreements with Australian mining firms.",
    url: "https://livemint.com/mock-minerals",
  },
];

// ---------------------------------------------------------------------------
// Article cleaning utilities
// ---------------------------------------------------------------------------

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function cleanArticleContent(raw: string): string {
  return stripHtml(raw).slice(0, 800);
}

function deduplicateByUrl(articles: RawArticle[]): RawArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

// ---------------------------------------------------------------------------
// NewsAPI fetcher
// ---------------------------------------------------------------------------

async function fetchFromNewsApi(): Promise<RawArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return [];
  }

  // Pick a rotating subset of keywords to keep queries fresh
  const keyword = NEWS_KEYWORDS[Math.floor(Date.now() / 3_600_000) % NEWS_KEYWORDS.length];
  const query = `(${keyword}) AND (India OR shipping OR supply chain OR trade)`;

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(MAX_ARTICLES_PER_FETCH));
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    console.error(`[newsService] NewsAPI error: ${res.status} ${res.statusText}`);
    return [];
  }

  const json = (await res.json()) as {
    articles?: Array<{
      title?: string;
      source?: { name?: string };
      publishedAt?: string;
      description?: string;
      content?: string;
      url?: string;
    }>;
  };

  return (json.articles ?? [])
    .filter((a) => a.title && a.url)
    .map((a) => ({
      title: a.title ?? "",
      source: a.source?.name ?? "Unknown",
      publishedAt: a.publishedAt ?? new Date().toISOString(),
      content: cleanArticleContent(
        [a.description ?? "", a.content ?? ""].join(" "),
      ),
      url: a.url ?? "",
    }));
}

// ---------------------------------------------------------------------------
// DataSourcePlugin implementation
// ---------------------------------------------------------------------------

class NewsDataSourcePlugin implements DataSourcePlugin {
  readonly name = "NewsAPI";

  async fetch(): Promise<DataSourceOutput[]> {
    let articles: RawArticle[];

    try {
      const fetched = await fetchFromNewsApi();
      articles = fetched.length > 0 ? fetched : MOCK_ARTICLES;
    } catch (err) {
      console.error("[newsService] Fetch failed, using mock articles:", err);
      articles = MOCK_ARTICLES;
    }

    const unique = deduplicateByUrl(articles).slice(0, MAX_ARTICLES_PER_FETCH);

    console.log(
      `[newsService] Articles ready: ${unique.length} (${unique.some((a) => MOCK_ARTICLES.includes(a)) ? "includes mock" : "live"})`,
    );

    return unique.map((article) => ({
      source: `${article.source} — "${article.title}" (${new Date(article.publishedAt).toDateString()})`,
      content: article.content,
    }));
  }
}

export const newsDataSource = new NewsDataSourcePlugin();
