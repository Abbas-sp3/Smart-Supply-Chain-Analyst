/**
 * Geopolitical Intelligence Engine — Public Feature API
 *
 * Only export what external modules should consume.
 * Internal services (groqService, newsService) are NOT exported.
 */

export type {
  IntelligenceReport,
  IntelligenceApiResponse,
  KeyDevelopment,
  AffectedImportCategory,
  AffectedProduct,
  AffectedTradeCorridor,
  AffectedPort,
  AffectedCountry,
  AffectedIndustry,
  SupplyChainImpact,
  AlternativeSupplyOption,
  Recommendation,
  SupportingEvidence,
  DataSourcePlugin,
  DataSourceOutput,
  RawArticle,
} from "./types";
