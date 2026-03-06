// ============================================================================
// KeoFlex ADA Compliance Module — Scanner Engine (Playwright + axe-core)
// ============================================================================

import { chromium, type Browser, type Page } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import type {
    ADAPageResult,
    ADAViolation,
    ADAViolationNode,
    POURPrinciple,
    WCAGLevel,
    ViolationImpact,
    ADAScanConfig,
} from './types';

// ============================================================================
// SEO Synergy Mapping
// ============================================================================
// axe rule IDs that, when fixed, also improve SEO performance.

const SEO_SYNERGY_MAP: Record<string, string> = {
    'image-alt': 'Missing alt text prevents image indexing by search engines.',
    'document-title': 'The <title> tag is a top-3 SEO ranking factor.',
    'html-has-lang': 'The lang attribute helps search engines serve correct regional results.',
    'heading-order': 'Proper heading hierarchy helps crawlers understand content structure.',
    'link-name': 'Descriptive link text improves anchor-based ranking signals.',
    'meta-viewport': 'Viewport meta is required for mobile-first indexing.',
    'frame-title': 'Titled iframes help crawlers understand embedded content.',
    'valid-lang': 'Valid language codes prevent incorrect regional ranking.',
    'html-lang-valid': 'Valid language codes prevent incorrect regional ranking.',
    'duplicate-id': 'Duplicate IDs can confuse crawler DOM parsing.',
    'list': 'Proper list markup helps search engines extract structured data.',
    'listitem': 'Proper list markup helps search engines extract structured data.',
    'definition-list': 'Proper definition lists help search engines extract structured data.',
    'dlitem': 'Proper definition lists help search engines extract structured data.',
    'table-fake-caption': 'Proper table captions improve content extraction by crawlers.',
    'td-has-header': 'Table headers help crawlers understand tabular data relationships.',
    'th-has-data-cells': 'Table headers help crawlers understand tabular data relationships.',
};

// ============================================================================
// WCAG Criteria → POUR Principle Mapping
// ============================================================================

const WCAG_TO_POUR: Record<string, POURPrinciple> = {
    // 1.x = Perceivable
    '1.1.1': 'perceivable', '1.2.1': 'perceivable', '1.2.2': 'perceivable',
    '1.2.3': 'perceivable', '1.2.4': 'perceivable', '1.2.5': 'perceivable',
    '1.3.1': 'perceivable', '1.3.2': 'perceivable', '1.3.3': 'perceivable',
    '1.3.4': 'perceivable', '1.3.5': 'perceivable', '1.3.6': 'perceivable',
    '1.4.1': 'perceivable', '1.4.2': 'perceivable', '1.4.3': 'perceivable',
    '1.4.4': 'perceivable', '1.4.5': 'perceivable', '1.4.6': 'perceivable',
    '1.4.7': 'perceivable', '1.4.8': 'perceivable', '1.4.9': 'perceivable',
    '1.4.10': 'perceivable', '1.4.11': 'perceivable', '1.4.12': 'perceivable',
    '1.4.13': 'perceivable',
    // 2.x = Operable
    '2.1.1': 'operable', '2.1.2': 'operable', '2.1.3': 'operable', '2.1.4': 'operable',
    '2.2.1': 'operable', '2.2.2': 'operable', '2.2.3': 'operable',
    '2.2.4': 'operable', '2.2.5': 'operable', '2.2.6': 'operable',
    '2.3.1': 'operable', '2.3.2': 'operable', '2.3.3': 'operable',
    '2.4.1': 'operable', '2.4.2': 'operable', '2.4.3': 'operable',
    '2.4.4': 'operable', '2.4.5': 'operable', '2.4.6': 'operable',
    '2.4.7': 'operable', '2.4.8': 'operable', '2.4.9': 'operable', '2.4.10': 'operable',
    '2.5.1': 'operable', '2.5.2': 'operable', '2.5.3': 'operable',
    '2.5.4': 'operable', '2.5.5': 'operable', '2.5.6': 'operable',
    // 3.x = Understandable
    '3.1.1': 'understandable', '3.1.2': 'understandable', '3.1.3': 'understandable',
    '3.1.4': 'understandable', '3.1.5': 'understandable', '3.1.6': 'understandable',
    '3.2.1': 'understandable', '3.2.2': 'understandable', '3.2.3': 'understandable',
    '3.2.4': 'understandable', '3.2.5': 'understandable',
    '3.3.1': 'understandable', '3.3.2': 'understandable', '3.3.3': 'understandable',
    '3.3.4': 'understandable', '3.3.5': 'understandable', '3.3.6': 'understandable',
    // 4.x = Robust
    '4.1.1': 'robust', '4.1.2': 'robust', '4.1.3': 'robust',
};

// ============================================================================
// WCAG Tag → Criteria Extraction
// ============================================================================

/**
 * Extract WCAG criteria strings from axe-core tags.
 * Tags look like: ["wcag2a", "wcag111", "cat.text-alternatives"]
 * We want to extract "1.1.1" from "wcag111".
 */
function extractWcagCriteria(tags: string[]): string[] {
    const criteria: string[] = [];
    for (const tag of tags) {
        // Match patterns like "wcag111", "wcag143", "wcag2110"
        const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
        if (match) {
            criteria.push(`${match[1]}.${match[2]}.${match[3]}`);
        }
    }
    return criteria;
}

/**
 * Determine the highest WCAG level from axe-core tags.
 */
function extractWcagLevel(tags: string[]): WCAGLevel {
    if (tags.some(t => t === 'wcag2aaa' || t === 'wcag21aaa')) return 'AAA';
    if (tags.some(t => t === 'wcag2aa' || t === 'wcag21aa')) return 'AA';
    return 'A';
}

/**
 * Determine POUR principle from WCAG criteria.
 */
function getPourPrinciple(criteria: string[]): POURPrinciple {
    for (const c of criteria) {
        if (WCAG_TO_POUR[c]) return WCAG_TO_POUR[c];
    }
    // Fallback: infer from first digit
    if (criteria.length > 0) {
        const firstDigit = criteria[0].charAt(0);
        if (firstDigit === '1') return 'perceivable';
        if (firstDigit === '2') return 'operable';
        if (firstDigit === '3') return 'understandable';
        if (firstDigit === '4') return 'robust';
    }
    return 'robust'; // safe default
}

// ============================================================================
// Browser Management
// ============================================================================

let browserInstance: Browser | null = null;

/**
 * Get or launch a shared Chromium browser instance.
 */
async function getBrowser(): Promise<Browser> {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }
    browserInstance = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
        ],
    });
    return browserInstance;
}

/**
 * Close the shared browser instance.
 */
export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}

// ============================================================================
// Core Scanning Functions
// ============================================================================

interface ViewportSpec {
    name: 'desktop' | 'mobile';
    width: number;
    height: number;
    isMobile: boolean;
}

const VIEWPORTS: ViewportSpec[] = [
    { name: 'desktop', width: 1280, height: 720, isMobile: false },
    { name: 'mobile', width: 375, height: 812, isMobile: true },
];

/**
 * Scan a single page at a specific viewport using axe-core.
 */
async function scanPageAtViewport(
    url: string,
    viewport: ViewportSpec,
    targetLevel: WCAGLevel,
    timeout: number,
): Promise<ADAPageResult> {
    const start = Date.now();
    const browser = await getBrowser();
    const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
        userAgent: viewport.isMobile
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            : undefined,
    });

    const page = await context.newPage();

    try {
        // Navigate with timeout
        await page.goto(url, {
            waitUntil: 'networkidle',
            timeout,
        });

        // Wait a bit for any lazy-loaded content / JS-injected ARIA
        await page.waitForTimeout(1500);

        // Build axe-core tags filter based on target level
        const wcagTags = ['wcag2a', 'wcag21a'];
        if (targetLevel === 'AA' || targetLevel === 'AAA') {
            wcagTags.push('wcag2aa', 'wcag21aa');
        }
        if (targetLevel === 'AAA') {
            wcagTags.push('wcag2aaa', 'wcag21aaa');
        }
        // Always include best-practice rules
        wcagTags.push('best-practice');

        // Run axe-core
        const axeResults = await new AxeBuilder({ page })
            .withTags(wcagTags)
            .analyze();

        // Map violations
        const violations: ADAViolation[] = axeResults.violations.map(v => {
            const wcagCriteria = extractWcagCriteria(v.tags);
            const wcagLevel = extractWcagLevel(v.tags);
            const pourPrinciple = getPourPrinciple(wcagCriteria);
            const seoSynergy = v.id in SEO_SYNERGY_MAP;

            return {
                id: v.id,
                impact: (v.impact as ViolationImpact) || 'moderate',
                wcagCriteria,
                wcagLevel,
                pourPrinciple,
                description: v.description,
                help: v.help,
                helpUrl: v.helpUrl,
                seoSynergy,
                seoSynergyNote: seoSynergy ? SEO_SYNERGY_MAP[v.id] : undefined,
                nodes: v.nodes.map(n => ({
                    html: n.html,
                    target: n.target.map(t => (typeof t === 'string' ? t : String(t))),
                    failureSummary: n.failureSummary || '',
                    xpath: n.xpath?.map(x => (typeof x === 'string' ? x : String(x))),
                })),
            };
        });

        return {
            url,
            viewport: viewport.name,
            viewportWidth: viewport.width,
            viewportHeight: viewport.height,
            violations,
            passCount: axeResults.passes.length,
            incompleteCount: axeResults.incomplete.length,
            inapplicableCount: axeResults.inapplicable.length,
            scanDurationMs: Date.now() - start,
            scannedAt: Date.now(),
        };
    } finally {
        await context.close();
    }
}

/**
 * Run a full ADA compliance scan on a URL across multiple viewports.
 */
export async function scanPage(config: ADAScanConfig): Promise<ADAPageResult[]> {
    const results: ADAPageResult[] = [];

    // Normalize URL
    const url = config.url.startsWith('http')
        ? config.url
        : `https://${config.url}`;

    // Determine which viewports to scan
    const viewportsToScan = VIEWPORTS.filter(v => {
        if (v.name === 'desktop' && !config.includeDesktop) return false;
        if (v.name === 'mobile' && !config.includeMobile) return false;
        return true;
    });

    for (const viewport of viewportsToScan) {
        try {
            const result = await scanPageAtViewport(
                url,
                viewport,
                config.targetLevel,
                config.timeout,
            );
            results.push(result);
        } catch (err) {
            console.error(`[ADA Scanner] Failed to scan ${url} at ${viewport.name}:`, err);
            // Push a failed result with zero data
            results.push({
                url,
                viewport: viewport.name,
                viewportWidth: viewport.width,
                viewportHeight: viewport.height,
                violations: [],
                passCount: 0,
                incompleteCount: 0,
                inapplicableCount: 0,
                scanDurationMs: 0,
                scannedAt: Date.now(),
            });
        }
    }

    return results;
}
