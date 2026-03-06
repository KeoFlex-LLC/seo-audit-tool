// ============================================================================
// KeoFlex ADA Compliance Module — Scanner Engine (Playwright + axe-core)
// ============================================================================
// Architecture modeled after pa11y: headless browser rendering, multi-runner
// support, warnings/notices/errors, screen capture, and detailed issue codes.
// ============================================================================

import { chromium, type Browser } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import type {
    ADAPageResult,
    ADAViolation,
    ADAViolationNode,
    ADAIncompleteItem,
    POURPrinciple,
    WCAGLevel,
    ViolationImpact,
    IssueType,
    ADAScanConfig,
} from './types';

// ============================================================================
// SEO Synergy Mapping
// ============================================================================

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
    'duplicate-id-active': 'Duplicate active IDs break label associations and confuse crawlers.',
    'list': 'Proper list markup helps search engines extract structured data.',
    'listitem': 'Proper list markup helps search engines extract structured data.',
    'table-fake-caption': 'Proper table captions improve content extraction by crawlers.',
    'td-has-header': 'Table headers help crawlers understand tabular data relationships.',
    'th-has-data-cells': 'Table headers help crawlers understand tabular data relationships.',
    'empty-heading': 'Empty headings waste crawl budget and confuse content structure.',
    'page-has-heading-one': 'H1 is a primary content signal for search engines.',
};

// ============================================================================
// WCAG Criteria → POUR Principle Mapping
// ============================================================================

const WCAG_TO_POUR: Record<string, POURPrinciple> = {
    '1.1.1': 'perceivable', '1.2.1': 'perceivable', '1.2.2': 'perceivable',
    '1.2.3': 'perceivable', '1.2.4': 'perceivable', '1.2.5': 'perceivable',
    '1.3.1': 'perceivable', '1.3.2': 'perceivable', '1.3.3': 'perceivable',
    '1.3.4': 'perceivable', '1.3.5': 'perceivable', '1.3.6': 'perceivable',
    '1.4.1': 'perceivable', '1.4.2': 'perceivable', '1.4.3': 'perceivable',
    '1.4.4': 'perceivable', '1.4.5': 'perceivable', '1.4.6': 'perceivable',
    '1.4.7': 'perceivable', '1.4.8': 'perceivable', '1.4.9': 'perceivable',
    '1.4.10': 'perceivable', '1.4.11': 'perceivable', '1.4.12': 'perceivable',
    '1.4.13': 'perceivable',
    '2.1.1': 'operable', '2.1.2': 'operable', '2.1.3': 'operable', '2.1.4': 'operable',
    '2.2.1': 'operable', '2.2.2': 'operable', '2.2.3': 'operable',
    '2.2.4': 'operable', '2.2.5': 'operable', '2.2.6': 'operable',
    '2.3.1': 'operable', '2.3.2': 'operable', '2.3.3': 'operable',
    '2.4.1': 'operable', '2.4.2': 'operable', '2.4.3': 'operable',
    '2.4.4': 'operable', '2.4.5': 'operable', '2.4.6': 'operable',
    '2.4.7': 'operable', '2.4.8': 'operable', '2.4.9': 'operable', '2.4.10': 'operable',
    '2.5.1': 'operable', '2.5.2': 'operable', '2.5.3': 'operable',
    '2.5.4': 'operable', '2.5.5': 'operable', '2.5.6': 'operable',
    '3.1.1': 'understandable', '3.1.2': 'understandable', '3.1.3': 'understandable',
    '3.1.4': 'understandable', '3.1.5': 'understandable', '3.1.6': 'understandable',
    '3.2.1': 'understandable', '3.2.2': 'understandable', '3.2.3': 'understandable',
    '3.2.4': 'understandable', '3.2.5': 'understandable',
    '3.3.1': 'understandable', '3.3.2': 'understandable', '3.3.3': 'understandable',
    '3.3.4': 'understandable', '3.3.5': 'understandable', '3.3.6': 'understandable',
    '4.1.1': 'robust', '4.1.2': 'robust', '4.1.3': 'robust',
};

// ============================================================================
// WCAG Tag Parsing
// ============================================================================

function extractWcagCriteria(tags: string[]): string[] {
    const criteria: string[] = [];
    for (const tag of tags) {
        const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
        if (match) {
            criteria.push(`${match[1]}.${match[2]}.${match[3]}`);
        }
    }
    return criteria;
}

function extractWcagLevel(tags: string[]): WCAGLevel {
    if (tags.some(t => t === 'wcag2aaa' || t === 'wcag21aaa')) return 'AAA';
    if (tags.some(t => t === 'wcag2aa' || t === 'wcag21aa')) return 'AA';
    return 'A';
}

function getPourPrinciple(criteria: string[]): POURPrinciple {
    for (const c of criteria) {
        if (WCAG_TO_POUR[c]) return WCAG_TO_POUR[c];
    }
    if (criteria.length > 0) {
        const d = criteria[0].charAt(0);
        if (d === '1') return 'perceivable';
        if (d === '2') return 'operable';
        if (d === '3') return 'understandable';
        if (d === '4') return 'robust';
    }
    return 'robust';
}

/**
 * Build a detailed issue code like pa11y's format:
 *   WCAG2AA.1.4.3.color-contrast
 */
function buildIssueCode(level: WCAGLevel, criteria: string[], ruleId: string): string {
    const prefix = `WCAG2${level}`;
    const criterion = criteria.length > 0 ? criteria[0] : 'best-practice';
    return `${prefix}.${criterion}.${ruleId}`;
}

// ============================================================================
// Browser Management
// ============================================================================

import chromiumMin from '@sparticuz/chromium-min';

// The CDN URL must match the @sparticuz/chromium-min version (143.0.4)
const CHROMIUM_REMOTE_URL =
    'https://github.com/nichochar/chromium-brotli/releases/download/v143.0.0/chromium-v143.0.0-pack.tar';

let browserInstance: Browser | null = null;

function isServerless(): boolean {
    return !!(
        process.env.VERCEL ||
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.NETLIFY
    );
}

async function getBrowser(): Promise<Browser> {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }

    console.log(`[ADA Scanner] Launching browser (serverless=${isServerless()})`);

    if (isServerless()) {
        const executablePath = await chromiumMin.executablePath(CHROMIUM_REMOTE_URL);
        console.log(`[ADA Scanner] Using chromium-min: ${executablePath}`);
        browserInstance = await chromium.launch({
            executablePath,
            headless: true,
            args: chromiumMin.args,
        });
    } else {
        browserInstance = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });
    }

    console.log('[ADA Scanner] Browser launched successfully');
    return browserInstance;
}

export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        try {
            await browserInstance.close();
        } catch (e) {
            console.warn('[ADA Scanner] Error closing browser:', e);
        }
        browserInstance = null;
    }
}

// ============================================================================
// Node Mapping
// ============================================================================

function mapNodes(nodes: Array<{
    html: string;
    target: Array<string | string[]>;
    failureSummary?: string;
    xpath?: Array<string | string[]>;
}>): ADAViolationNode[] {
    return nodes.map(n => ({
        html: n.html,
        target: n.target.map(t => (typeof t === 'string' ? t : String(t))),
        failureSummary: n.failureSummary || '',
        xpath: n.xpath?.map(x => (typeof x === 'string' ? x : String(x))),
    }));
}

// ============================================================================
// Core Scanning
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

async function scanPageAtViewport(
    url: string,
    viewport: ViewportSpec,
    config: ADAScanConfig,
): Promise<ADAPageResult> {
    const start = Date.now();

    // CRITICAL: getBrowser() must NOT be caught silently.
    // If it throws, the caller must know the scan failed.
    const browser = await getBrowser();

    const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
        userAgent: viewport.isMobile
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
            : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    try {
        console.log(`[ADA Scanner] Navigating to ${url} (${viewport.name} ${viewport.width}x${viewport.height})`);

        // Navigate with timeout
        const response = await page.goto(url, {
            waitUntil: 'load',
            timeout: config.timeout,
        });

        if (!response) {
            throw new Error(`Failed to load page: no response received from ${url}`);
        }

        const statusCode = response.status();
        console.log(`[ADA Scanner] Page loaded: status=${statusCode}`);

        if (statusCode >= 400) {
            throw new Error(`Page returned HTTP ${statusCode}`);
        }

        // Wait for dynamic content to settle
        await page.waitForTimeout(2000);

        // Take screenshot if configured
        let screenshotBase64: string | undefined;
        if (config.screenCapture) {
            try {
                const buf = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 60 });
                screenshotBase64 = buf.toString('base64');
            } catch (e) {
                console.warn('[ADA Scanner] Screenshot failed:', e);
            }
        }

        // Build axe-core tags filter
        const wcagTags = ['wcag2a', 'wcag21a'];
        if (config.targetLevel === 'AA' || config.targetLevel === 'AAA') {
            wcagTags.push('wcag2aa', 'wcag21aa');
        }
        if (config.targetLevel === 'AAA') {
            wcagTags.push('wcag2aaa', 'wcag21aaa');
        }
        wcagTags.push('best-practice');

        console.log(`[ADA Scanner] Running axe-core with tags: ${wcagTags.join(', ')}`);

        // Run axe-core analysis
        const axeResults = await new AxeBuilder({ page })
            .withTags(wcagTags)
            .analyze();

        console.log(`[ADA Scanner] axe-core results: violations=${axeResults.violations.length}, passes=${axeResults.passes.length}, incomplete=${axeResults.incomplete.length}, inapplicable=${axeResults.inapplicable.length}`);

        // --- Map VIOLATIONS (errors) ---
        const violations: ADAViolation[] = axeResults.violations.map(v => {
            const wcagCriteria = extractWcagCriteria(v.tags);
            const wcagLevel = extractWcagLevel(v.tags);
            const pourPrinciple = getPourPrinciple(wcagCriteria);
            const seoSynergy = v.id in SEO_SYNERGY_MAP;

            return {
                id: v.id,
                impact: (v.impact as ViolationImpact) || 'moderate',
                type: 'error' as IssueType,
                code: buildIssueCode(wcagLevel, wcagCriteria, v.id),
                wcagCriteria,
                wcagLevel,
                pourPrinciple,
                description: v.description,
                help: v.help,
                helpUrl: v.helpUrl,
                seoSynergy,
                seoSynergyNote: seoSynergy ? SEO_SYNERGY_MAP[v.id] : undefined,
                nodes: mapNodes(v.nodes),
            };
        });

        // --- Map INCOMPLETE items (warnings — need manual review) ---
        const warnings: ADAViolation[] = [];
        const incomplete: ADAIncompleteItem[] = [];

        for (const item of axeResults.incomplete) {
            const wcagCriteria = extractWcagCriteria(item.tags);
            const pourPrinciple = getPourPrinciple(wcagCriteria);
            const wcagLevel = extractWcagLevel(item.tags);

            // Add to warnings list for display
            if (config.includeWarnings) {
                warnings.push({
                    id: item.id,
                    impact: (item.impact as ViolationImpact) || 'moderate',
                    type: 'warning',
                    code: buildIssueCode(wcagLevel, wcagCriteria, item.id),
                    wcagCriteria,
                    wcagLevel,
                    pourPrinciple,
                    description: item.description,
                    help: item.help,
                    helpUrl: item.helpUrl,
                    seoSynergy: item.id in SEO_SYNERGY_MAP,
                    seoSynergyNote: item.id in SEO_SYNERGY_MAP ? SEO_SYNERGY_MAP[item.id] : undefined,
                    nodes: mapNodes(item.nodes),
                });
            }

            incomplete.push({
                id: item.id,
                description: item.description,
                help: item.help,
                helpUrl: item.helpUrl,
                impact: (item.impact as ViolationImpact) || null,
                nodes: mapNodes(item.nodes),
                wcagCriteria,
                pourPrinciple,
            });
        }

        // --- Map PASSES as notices (informational) ---
        const notices: ADAViolation[] = [];
        if (config.includeNotices) {
            for (const pass of axeResults.passes) {
                const wcagCriteria = extractWcagCriteria(pass.tags);
                const wcagLevel = extractWcagLevel(pass.tags);
                const pourPrinciple = getPourPrinciple(wcagCriteria);

                notices.push({
                    id: pass.id,
                    impact: 'minor',
                    type: 'notice',
                    code: buildIssueCode(wcagLevel, wcagCriteria, pass.id),
                    wcagCriteria,
                    wcagLevel,
                    pourPrinciple,
                    description: pass.description,
                    help: `✓ ${pass.help}`,
                    helpUrl: pass.helpUrl,
                    seoSynergy: false,
                    nodes: [],
                });
            }
        }

        const totalChecks = axeResults.violations.length
            + axeResults.passes.length
            + axeResults.incomplete.length
            + axeResults.inapplicable.length;

        return {
            url,
            viewport: viewport.name,
            viewportWidth: viewport.width,
            viewportHeight: viewport.height,
            violations,
            warnings,
            notices,
            incomplete,
            passCount: axeResults.passes.length,
            inapplicableCount: axeResults.inapplicable.length,
            totalChecksRun: totalChecks,
            scanDurationMs: Date.now() - start,
            scannedAt: Date.now(),
            screenshotBase64,
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[ADA Scanner] Scan failed for ${url} at ${viewport.name}:`, errorMsg);

        // Return a result struct with the error — DON'T silently return 0/0
        return {
            url,
            viewport: viewport.name,
            viewportWidth: viewport.width,
            viewportHeight: viewport.height,
            violations: [],
            warnings: [],
            notices: [],
            incomplete: [],
            passCount: 0,
            inapplicableCount: 0,
            totalChecksRun: 0,
            scanDurationMs: Date.now() - start,
            scannedAt: Date.now(),
            scanError: errorMsg,
        };
    } finally {
        await context.close();
    }
}

/**
 * Run a full ADA compliance scan on a URL across multiple viewports.
 * Unlike the previous version, this bubbles up errors properly.
 */
export async function scanPage(config: ADAScanConfig): Promise<ADAPageResult[]> {
    const results: ADAPageResult[] = [];

    const url = config.url.startsWith('http')
        ? config.url
        : `https://${config.url}`;

    const viewportsToScan = VIEWPORTS.filter(v => {
        if (v.name === 'desktop' && !config.includeDesktop) return false;
        if (v.name === 'mobile' && !config.includeMobile) return false;
        return true;
    });

    console.log(`[ADA Scanner] Starting scan of ${url} across ${viewportsToScan.length} viewport(s)`);

    for (const viewport of viewportsToScan) {
        const result = await scanPageAtViewport(url, viewport, config);
        results.push(result);

        // Log summary per viewport
        if (result.scanError) {
            console.error(`[ADA Scanner] ${viewport.name}: FAILED — ${result.scanError}`);
        } else {
            console.log(`[ADA Scanner] ${viewport.name}: ${result.violations.length} violations, ${result.passCount} passes, ${result.incomplete.length} incomplete, ${result.totalChecksRun} total checks`);
        }
    }

    return results;
}
