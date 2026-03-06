// ============================================================================
// KeoFlex ADA Compliance Module — Type Definitions
// ============================================================================

/** WCAG conformance levels */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/** POUR principles */
export type POURPrinciple = 'perceivable' | 'operable' | 'understandable' | 'robust';

/** Impact severity from axe-core */
export type ViolationImpact = 'critical' | 'serious' | 'moderate' | 'minor';

// --- Violation Detail Types ---

/** A single DOM element that violates an axe rule */
export interface ADAViolationNode {
    html: string;             // The failing HTML snippet
    target: string[];         // CSS selectors to locate the element
    failureSummary: string;   // "Fix any of the following: ..."
    xpath?: string[];         // Optional XPath selectors
}

/** One axe-core rule violation (may affect multiple DOM nodes) */
export interface ADAViolation {
    id: string;               // axe rule ID, e.g. "color-contrast"
    impact: ViolationImpact;
    wcagCriteria: string[];   // ["1.4.3", "1.4.6"]
    wcagLevel: WCAGLevel;
    pourPrinciple: POURPrinciple;
    description: string;      // Human-readable description
    help: string;             // Short help text
    helpUrl: string;          // Link to Deque/W3C documentation
    nodes: ADAViolationNode[];
    seoSynergy: boolean;      // True if fixing also improves SEO
    seoSynergyNote?: string;  // Why this matters for SEO
}

// --- Page-Level Results ---

/** Results from scanning a single page at a specific viewport */
export interface ADAPageResult {
    url: string;
    viewport: 'desktop' | 'mobile';
    viewportWidth: number;
    viewportHeight: number;
    violations: ADAViolation[];
    passCount: number;        // Number of passing checks
    incompleteCount: number;  // Checks needing manual review
    inapplicableCount: number;
    scanDurationMs: number;
    scannedAt: number;        // timestamp
}

// --- Deduplication ---

/** A site-wide issue grouped from identical violations across pages */
export interface ADASiteIssue {
    ruleId: string;
    impact: ViolationImpact;
    description: string;
    help: string;
    helpUrl: string;
    pourPrinciple: POURPrinciple;
    wcagCriteria: string[];
    wcagLevel: WCAGLevel;
    affectedPages: number;
    totalNodes: number;       // Total affected DOM elements across all pages
    exampleHtml: string;      // Representative failing HTML
    exampleTarget: string[];  // CSS selectors from the example
    seoSynergy: boolean;
    seoSynergyNote?: string;
}

// --- POUR Breakdown ---

export interface POURCategoryScore {
    principle: POURPrinciple;
    label: string;            // "Perceivable", "Operable", etc.
    violations: number;
    passes: number;
    score: number;            // 0-100 within this category
}

// --- Full ADA Report ---

export interface ADAReport {
    id: string;
    url: string;
    createdAt: number;

    // Scoring
    complianceScore: number;  // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    targetLevel: WCAGLevel;

    // Violation counts
    totalViolations: number;
    criticalCount: number;
    seriousCount: number;
    moderateCount: number;
    minorCount: number;

    // Breakdowns
    pourBreakdown: POURCategoryScore[];
    pageResults: ADAPageResult[];
    siteIssues: ADASiteIssue[];

    // Meta
    scanDurationMs: number;
    legalDisclaimer: string;
}

// --- Remediation Knowledge Base ---

export interface RemediationEntry {
    ruleId: string;
    title: string;
    explanation: string;      // Plain-language why this matters
    beforeCode: string;       // Example of bad HTML
    afterCode: string;        // Corrected HTML example
    wcagLink: string;         // Direct W3C link
    seoImpact?: string;       // How this affects SEO
}

// --- Scan Configuration ---

export interface ADAScanConfig {
    url: string;
    targetLevel: WCAGLevel;
    includeDesktop: boolean;
    includeMobile: boolean;
    timeout: number;          // Per-page timeout in ms
}
