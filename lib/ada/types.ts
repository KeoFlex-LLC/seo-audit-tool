// ============================================================================
// KeoFlex ADA Compliance Module — Type Definitions
// ============================================================================

/** WCAG conformance levels */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/** POUR principles */
export type POURPrinciple = 'perceivable' | 'operable' | 'understandable' | 'robust';

/** Impact severity from axe-core */
export type ViolationImpact = 'critical' | 'serious' | 'moderate' | 'minor';

/** Issue type classification (matches pa11y output) */
export type IssueType = 'error' | 'warning' | 'notice';

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
    type: IssueType;          // error, warning, or notice
    code: string;             // Detailed code, e.g. "WCAG2AA.1.4.3.color-contrast"
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

/** Items that need manual review (axe-core "incomplete" results) */
export interface ADAIncompleteItem {
    id: string;
    description: string;
    help: string;
    helpUrl: string;
    impact: ViolationImpact | null;
    nodes: ADAViolationNode[];
    wcagCriteria: string[];
    pourPrinciple: POURPrinciple;
}

// --- Page-Level Results ---

/** Results from scanning a single page at a specific viewport */
export interface ADAPageResult {
    url: string;
    viewport: 'desktop' | 'mobile';
    viewportWidth: number;
    viewportHeight: number;
    violations: ADAViolation[];       // Errors — definite accessibility failures
    warnings: ADAViolation[];         // Warnings — potential issues
    notices: ADAViolation[];          // Notices — informational best practices
    incomplete: ADAIncompleteItem[];  // Needs manual review
    passCount: number;                // Number of passing checks
    inapplicableCount: number;
    totalChecksRun: number;           // Total rules evaluated
    scanDurationMs: number;
    scannedAt: number;                // timestamp
    scanError?: string;               // Error message if scan failed
    screenshotBase64?: string;        // Page screenshot after scan
}

// --- Deduplication ---

/** A site-wide issue grouped from identical violations across pages */
export interface ADASiteIssue {
    ruleId: string;
    impact: ViolationImpact;
    type: IssueType;
    code: string;
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
    warnings: number;
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

    // Issue counts
    totalViolations: number;
    totalWarnings: number;
    totalNotices: number;
    totalIncomplete: number;  // Needs manual review
    criticalCount: number;
    seriousCount: number;
    moderateCount: number;
    minorCount: number;
    totalChecksRun: number;

    // Breakdowns
    pourBreakdown: POURCategoryScore[];
    pageResults: ADAPageResult[];
    siteIssues: ADASiteIssue[];

    // Meta
    scanDurationMs: number;
    legalDisclaimer: string;
    scanErrors: string[];     // Any errors encountered during scanning
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
    includeWarnings: boolean;
    includeNotices: boolean;
    screenCapture: boolean;
    timeout: number;          // Per-page timeout in ms
}
