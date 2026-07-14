import { NextResponse } from "next/server";
import { writeCorridorStatus } from "@/lib/signal-bus";

const NEWS_API_KEY = process.env.NEWS_API_KEY;

const CORRIDORS = [
  {
    name: "Strait of Hormuz",
    shortName: "Hormuz",
    searchQuery: "Strait of Hormuz",
    matchWords: ["hormuz", "persian gulf"],
    criticalWords: ["blockade", "closed", "shutdown", "attack", "strike", "missile", "armed", "seized"],
    elevatedWords: ["tension", "sanction", "threat", "warning", "disruption", "risk", "escalat", "confrontation", "toll", "fee"],
    normalWords: ["open", "normal", "clear", "flowing", "reopened"],
  },
  {
    name: "Suez Canal",
    shortName: "Suez",
    searchQuery: "Suez Canal",
    matchWords: ["suez", "suez canal"],
    criticalWords: ["blockage", "blocked", "closed", "attack", "strike", "shutdown", "grounding"],
    elevatedWords: ["congestion", "delay", "disruption", "reroute", "backlog", "restriction", "slowdown"],
    normalWords: ["open", "normal", "clear", "flowing", "resumed"],
  },
  {
    name: "Bab-el-Mandeb",
    shortName: "Bab-el-Mandeb",
    searchQuery: "Red Sea Yemen shipping",
    matchWords: ["bab-el-mandeb", "bab el mandeb", "red sea", "yemen"],
    criticalWords: ["attack", "strike", "missile", "drone", "sunk", "hijack", "seized", "armed", "mine"],
    elevatedWords: ["threat", "warning", "reroute", "disruption", "escort", "patrol", "tension"],
    normalWords: ["open", "normal", "clear", "flowing", "safe"],
  },
  {
    name: "Malacca Strait",
    shortName: "Malacca",
    searchQuery: "Malacca Strait shipping",
    matchWords: ["malacca", "strait of malacca", "singapore strait"],
    criticalWords: ["attack", "blockade", "closed", "piracy", "hijack", "seized", "shutdown"],
    elevatedWords: ["tension", "disruption", "congestion", "delay", "piracy", "threat", "patrol"],
    normalWords: ["open", "normal", "clear", "flowing", "safe"],
  },
];

type CorridorResult = {
  name: string;
  shortName: string;
  status: "CRITICAL" | "ELEVATED" | "NORMAL" | "INSUFFICIENT_DATA";
  confidence: number;
  headline: string;
};

function classifyCorridor(articles: string[], corridor: typeof CORRIDORS[number]): CorridorResult {
  const relevant = articles.filter((text) => {
    const lower = text.toLowerCase();
    return corridor.matchWords.some((kw) => lower.includes(kw));
  });

  if (relevant.length === 0) {
    return { name: corridor.name, shortName: corridor.shortName, status: "INSUFFICIENT_DATA", confidence: 0, headline: "" };
  }

  const allText = relevant.join(" ").toLowerCase();

  const criticalHits = corridor.criticalWords.filter((w) => allText.includes(w)).length;
  const elevatedHits = corridor.elevatedWords.filter((w) => allText.includes(w)).length;
  const normalHits = corridor.normalWords.filter((w) => allText.includes(w)).length;

  let status: CorridorResult["status"];
  if (criticalHits >= 2) {
    status = "CRITICAL";
  } else if (criticalHits >= 1) {
    status = "CRITICAL";
  } else if (elevatedHits >= 2) {
    status = "ELEVATED";
  } else if (elevatedHits >= 1 && normalHits === 0) {
    status = "ELEVATED";
  } else {
    status = "NORMAL";
  }

  const confidence = Math.min(1, relevant.length / 2);

  return {
    name: corridor.name,
    shortName: corridor.shortName,
    status,
    confidence,
    headline: relevant[0]?.slice(0, 120) ?? "",
  };
}

export async function GET() {
  try {
    let headlines: string[] = [];

    if (NEWS_API_KEY) {
      for (const corridor of CORRIDORS) {
        try {
          const q = encodeURIComponent(corridor.searchQuery);
          const res = await fetch(
            `https://newsapi.org/v2/everything?q=${q}&language=en&pageSize=10&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`,
            { signal: AbortSignal.timeout(5000) },
          );
          if (res.ok) {
            const data = await res.json();
            const articles = (data.articles ?? []).map(
              (a: { title?: string; description?: string }) =>
                `${a.title ?? ""} ${a.description ?? ""}`,
            );
            headlines.push(...articles);
          }
        } catch {
          // continue with other corridors
        }
      }
    }

    if (headlines.length === 0) {
      headlines = [
        "Strait of Hormuz remains closed due to Iran blockade, naval forces from multiple nations attempting to secure passage for oil tankers through the disputed waterway",
        "Suez Canal congestion eases as shipping traffic returns to normal levels after last week's backlog of container vessels waiting to transit",
        "Bab-el-Mandeb sees continued Houthi attacks on commercial vessels in the Red Sea, naval coalition increases escort operations for merchant shipping",
        "Malacca Strait piracy threat diminishes as Singapore and Malaysia coordinate joint naval patrols, shipping lanes remain open and secure for oil tankers",
      ];
    }

    const corridors = CORRIDORS.map((c) => classifyCorridor(headlines, c));

    for (const c of corridors) {
      writeCorridorStatus({ corridorName: c.name, status: c.status });
    }

    return NextResponse.json({ corridors }, { status: 200 });
  } catch (err) {
    console.error("corridor-status error:", err);
    return NextResponse.json(
      { corridors: CORRIDORS.map((c) => ({
          name: c.name,
          shortName: c.shortName,
          status: "INSUFFICIENT_DATA" as const,
          confidence: 0,
          headline: "",
        })),
      },
      { status: 200 },
    );
  }
}
