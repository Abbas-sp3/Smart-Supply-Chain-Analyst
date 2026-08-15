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
import type { CountryProfile } from "@/data/countries/types";

// ---------------------------------------------------------------------------
// Curated mock articles — used when NEWS_API_KEY is not set.
// Covers the most strategically important India trade intelligence topics.
// ---------------------------------------------------------------------------
const MOCK_ARTICLES_INDIA: RawArticle[] = [
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


// ---------------------------------------------------------------------------
// Article cleaning utilities
// ---------------------------------------------------------------------------

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Simple Jaccard similarity for title deduplication
function getSimilarity(s1: string, s2: string): number {
  const w1 = new Set(s1.toLowerCase().split(/\W+/).filter(Boolean));
  const w2 = new Set(s2.toLowerCase().split(/\W+/).filter(Boolean));
  if (w1.size === 0 || w2.size === 0) return 0;
  let intersection = 0;
  for (const w of w1) {
    if (w2.has(w)) intersection++;
  }
  return intersection / (w1.size + w2.size - intersection);
}

function deduplicateByContent(articles: RawArticle[]): RawArticle[] {
  const unique: RawArticle[] = [];
  for (const article of articles) {
    // If it's more than 40% similar to an existing title, skip it
    const isDuplicate = unique.some((u) => getSimilarity(u.title, article.title) > 0.4);
    if (!isDuplicate) {
      unique.push(article);
    }
  }
  return unique;
}

// ---------------------------------------------------------------------------
// NewsAPI fetcher
// ---------------------------------------------------------------------------

async function fetchFromNewsApi(country: CountryProfile): Promise<RawArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return [];
  }

  const keyword = NEWS_KEYWORDS[Math.floor(Date.now() / 3_600_000) % NEWS_KEYWORDS.length];
  const query = `(${keyword}) AND (${country.name} OR shipping OR supply chain OR trade)`;

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(MAX_ARTICLES_PER_FETCH * 2)); // Fetch more to allow deduplication
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
    .filter((a) => a.title && a.description)
    .map((a) => ({
      title: a.title ?? "",
      source: a.source?.name ?? "Unknown",
      publishedAt: a.publishedAt ?? new Date().toISOString(),
      content: stripHtml(a.description ?? ""), // We only keep description now per instructions
      url: a.url ?? "",
    }));
}

// ---------------------------------------------------------------------------
// DataSourcePlugin implementation
// ---------------------------------------------------------------------------

export class NewsDataSourcePlugin implements DataSourcePlugin {
  readonly name = "NewsAPI";

  async fetch(country: CountryProfile): Promise<DataSourceOutput[]> {
    let articles: RawArticle[];

    try {
      const fetched = await fetchFromNewsApi(country);
      const mock = getMockArticles(country);
      articles = fetched.length > 0 ? fetched : mock;
    } catch (err) {
      console.error("[newsService] Fetch failed, using mock articles:", err);
      const mock = getMockArticles(country);
      articles = mock;
    }

    const unique = deduplicateByContent(articles).slice(0, MAX_ARTICLES_PER_FETCH);

    const isMock = unique.some((a) => getMockArticles(country).includes(a));
    console.log(
      `[newsService] Articles ready: ${unique.length} (${isMock ? "includes mock" : "live"}) for ${country.id}`,
    );

    // Return structured data instead of string formatting
    return [
      {
        source: this.name,
        data: unique.map((a) => ({
          title: a.title,
          description: a.content, // mapped to description
          source: a.source,
          publishedAt: a.publishedAt,
        })),
      },
    ];
  }
}

export const newsDataSource = new NewsDataSourcePlugin();
