// ============================================================================
// KeoFlex SEO Audit Tool — Core Type Definitions
// ============================================================================

// --- Job Management ---

export type AuditStatus =
  | 'queued'
  | 'crawling'
  | 'analyzing'
  | 'fetching-serp'
  | 'fetching-vitals'
  | 'crawling-competitors'
  | 'generating-ai'
  | 'completed'
  | 'failed';

export interface AuditStep {
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface AuditJob {
  id: string;
  url: string;
  keyword: string;
  status: AuditStatus;
  steps: AuditStep[];
  createdAt: number;
  updatedAt: number;
  report?: AuditReport;
  error?: string;
}

// --- Page Audit (Module A) ---

export interface HeadingInfo {
  tag: string; // e.g., "h1", "h2"
  text: string;
  count: number;
}

export interface LinkInfo {
  url: string;
  text: string;
  type: 'internal' | 'external';
  statusCode?: number;
  isBroken?: boolean;
}

export interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
  format?: string;
  hasLazyLoading?: boolean;
}

// --- Phase 2: Enhanced Audit Data ---

export interface SchemaMarkup {
  types: string[];            // e.g., ["Organization", "WebPage", "FAQPage"]
  count: number;
  hasJsonLd: boolean;
  hasMicrodata: boolean;
}

export interface SecurityHeaders {
  hasHSTS: boolean;
  hasCSP: boolean;
  hasXFrameOptions: boolean;
  hasXContentType: boolean;
  hasReferrerPolicy: boolean;
  hasPermissionsPolicy: boolean;
  score: number;              // 0-6 count of present headers
}

export interface AccessibilityInfo {
  hasViewport: boolean;
  viewportContent: string;
  hasLangAttribute: boolean;
  langValue: string;
  imagesWithoutAlt: number;
  totalImages: number;
  formInputsWithoutLabel: number;
}

export interface ContentQuality {
  readabilityGrade: number;   // Flesch-Kincaid grade level
  avgSentenceLength: number;
  keywordCount: number;
  keywordDensity: number;     // percentage
  hasKeywordInTitle: boolean;
  hasKeywordInH1: boolean;
  hasKeywordInMeta: boolean;
}

export interface SocialMeta {
  ogComplete: boolean;        // has title + desc + image
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;       // summary, summary_large_image, etc.
  twitterTitle?: string;
  twitterImage?: string;
  twitterComplete: boolean;
}

// --- Phase 3: Google Ranking Dominance ---

export interface IndexabilityInfo {
  isIndexable: boolean;
  robotsDirective: string;      // e.g. "index,follow"
  hasNoindex: boolean;
  hasNofollow: boolean;
  xRobotsTag: string;
  canonicalUrl: string;
  canonicalStatus: 'match' | 'mismatch' | 'missing';
  hasRedirectChain: boolean;
  redirectCount: number;
}

export interface EEATSignals {
  hasAuthorInfo: boolean;
  hasAboutPage: boolean;
  hasContactPage: boolean;
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;
  trustScore: number;           // 0-100
  signals: string[];            // human-readable list
  sameAsLinks: string[];        // Schema.org sameAs URLs (social profiles, Knowledge Panel)
}

export interface PageBudget {
  totalResourceCount: number;
  scriptCount: number;
  stylesheetCount: number;
  totalTransferSizeKb: number;
  renderBlockingCount: number;
  hasExcessiveJs: boolean;      // > 300KB estimated
}

export interface InternalLinkTopology {
  uniqueInternalLinks: number;
  selfReferencing: number;
  hasOrphanRisk: boolean;       // 0 inbound from site
  maxLinkDepth: number;
  linkDistribution: Record<string, number>;  // anchor text → count
}

export interface ContentComprehensiveness {
  topicCoverage: string[];      // topics found via headings
  hasFAQ: boolean;
  hasTableOfContents: boolean;
  contentSections: number;
  estimatedReadTimeMin: number;
  entityCount: number;          // unique proper nouns/terms
  missingTopics: string[];      // from competitor comparison
}

export interface RichResultEligibility {
  eligible: string[];           // ["FAQ", "Breadcrumb", "Organization"]
  missing: string[];            // schema types that would unlock rich results
  currentSchemaTypes: string[];
  potentialCTRBoost: 'low' | 'medium' | 'high';
}

export interface MetaInfo {
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface PageAudit {
  url: string;
  finalUrl: string; // after redirects
  statusCode: number;
  meta: MetaInfo;
  headings: HeadingInfo[];
  wordCount: number;
  internalLinks: LinkInfo[];
  externalLinks: LinkInfo[];
  images: ImageInfo[];
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  isHttps: boolean;
  loadTimeMs: number;
  screenshotBase64?: string;
  crawledAt: number;
  // Phase 2 fields
  schemaMarkup: SchemaMarkup;
  securityHeaders: SecurityHeaders;
  accessibility: AccessibilityInfo;
  contentQuality: ContentQuality;
  socialMeta: SocialMeta;
  hasCanonicalMismatch: boolean;
  hreflangTags: string[];
  brokenLinks: LinkInfo[];
  // Phase 3 fields
  indexability: IndexabilityInfo;
  eeat: EEATSignals;
  pageBudget: PageBudget;
  internalLinkTopology: InternalLinkTopology;
  contentComprehensiveness: ContentComprehensiveness;
  richResults: RichResultEligibility;
}

// --- Core Web Vitals (Module C) ---

export interface CoreWebVitals {
  performanceScore: number; // 0-100
  lcp: number;       // Largest Contentful Paint (ms)
  inp: number;       // Interaction to Next Paint (ms)
  cls: number;       // Cumulative Layout Shift
  fcp: number;       // First Contentful Paint (ms)
  si: number;        // Speed Index (ms)
  tbt: number;       // Total Blocking Time (ms)
  lcpRating: 'good' | 'needs-improvement' | 'poor';
  inpRating: 'good' | 'needs-improvement' | 'poor';
  clsRating: 'good' | 'needs-improvement' | 'poor';
}

// --- SERP & Keywords (Module B) ---

export interface SerpFeature {
  type: 'ai_overview' | 'featured_snippet' | 'people_also_ask' | 'local_pack' | 'video' | 'images' | 'shopping';
  present: boolean;
}

export interface SerpResult {
  position: number;
  url: string;
  title: string;
  description: string;
  domain: string;
}

export interface KeywordAnalysis {
  keyword: string;
  userPosition: number | null;    // null = not found in top 100
  totalResults: number;
  serpFeatures: SerpFeature[];
  topResults: SerpResult[];
  zeroClickRisk: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
}

// --- Competitor Analysis (Module C/Gap) ---

export interface CompetitorData {
  url: string;
  domain: string;
  position: number;
  audit?: PageAudit;
  vitals?: CoreWebVitals;
}

export interface GapMetric {
  metric: string;
  userValue: number | string;
  competitorValue: number | string;
  difference: number | string;
  winner: 'user' | 'competitor' | 'tie';
  severity: 'critical' | 'warning' | 'notice' | 'good';
}

export interface GapAnalysis {
  competitor: CompetitorData;
  metrics: GapMetric[];
  contentGap: string;
  technicalGap: string;
  overallAdvantage: 'user' | 'competitor' | 'mixed';
}

// --- AI Recommendations ---

export interface AIRecommendation {
  priority: number;       // 1 = highest
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: 'content' | 'technical' | 'performance' | 'strategy';
}

// --- Health Score ---

export interface HealthCategory {
  name: string;
  score: number;        // 0-100 within this category
  maxScore: number;     // max possible weight
  weightedScore: number;
  issues: HealthIssue[];
}

export interface HealthIssue {
  severity: 'critical' | 'warning' | 'notice';
  category: string;
  message: string;
  recommendation: string;
}

export interface HealthScore {
  overall: number;     // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  categories: HealthCategory[];
  issues: HealthIssue[];
}

// --- Full Report ---

export interface AuditReport {
  id: string;
  url: string;
  keyword: string;
  createdAt: number;
  pageAudit: PageAudit;
  healthScore: HealthScore;
  vitals?: CoreWebVitals;
  keywordAnalysis?: KeywordAnalysis;
  competitors: CompetitorData[];
  gapAnalyses: GapAnalysis[];
  aiRecommendations: AIRecommendation[];
}
