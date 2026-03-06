// ============================================================================
// KeoFlex ADA Compliance Module — Scanner Engine (Puppeteer + axe-core)
// ============================================================================
// Uses puppeteer-core + @sparticuz/chromium-min for Vercel serverless,
// with axe-core injected directly into the page for WCAG evaluation.
// ============================================================================

import puppeteer, { type Browser } from 'puppeteer-core';
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

function buildIssueCode(level: WCAGLevel, criteria: string[], ruleId: string): string {
    const prefix = `WCAG2${level}`;
    const criterion = criteria.length > 0 ? criteria[0] : 'best-practice';
    return `${prefix}.${criterion}.${ruleId}`;
}

// ============================================================================
// Browser Management — Puppeteer + @sparticuz/chromium-min
// ============================================================================

import chromiumMin from '@sparticuz/chromium-min';

// Official release asset matching @sparticuz/chromium-min v143.0.4
const CHROMIUM_REMOTE_URL =
    'https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar';

function isServerless(): boolean {
    return !!(
        process.env.VERCEL ||
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.NETLIFY
    );
}

async function launchBrowser(): Promise<Browser> {
    console.log(`[ADA Scanner] Launching browser (serverless=${isServerless()})`);

    if (isServerless()) {
        const executablePath = await chromiumMin.executablePath(CHROMIUM_REMOTE_URL);
        console.log(`[ADA Scanner] Using chromium-min: ${executablePath}`);
        return puppeteer.launch({
            executablePath,
            headless: true,
            args: chromiumMin.args,
            defaultViewport: null,
        });
    } else {
        // Local dev — try to find Chrome/Chromium on the system
        const possiblePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
        ];
        let localChrome = '';
        for (const p of possiblePaths) {
            try {
                const fs = await import('fs');
                if (fs.existsSync(p)) { localChrome = p; break; }
            } catch { /* ignore */ }
        }
        if (!localChrome) {
            throw new Error('No Chrome/Chromium found locally. Install Google Chrome or set CHROME_PATH.');
        }
        console.log(`[ADA Scanner] Using local Chrome: ${localChrome}`);
        return puppeteer.launch({
            executablePath: localChrome,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
            defaultViewport: null,
        });
    }
}

export async function closeBrowser(browser: Browser | null): Promise<void> {
    if (browser) {
        try { await browser.close(); } catch (e) {
            console.warn('[ADA Scanner] Error closing browser:', e);
        }
    }
}

// ============================================================================
// axe-core source (read once, inject into each page)
// ============================================================================

let axeSource: string | null = null;

async function getAxeSource(): Promise<string> {
    if (axeSource) return axeSource;
    const axeCorePath = require.resolve('axe-core');
    const fs = await import('fs');
    const path = await import('path');
    // axe.min.js is in the same directory as axe-core's main entry
    const axeDir = path.dirname(axeCorePath);
    const minPath = path.join(axeDir, 'axe.min.js');
    axeSource = fs.existsSync(minPath)
        ? fs.readFileSync(minPath, 'utf-8')
        : fs.readFileSync(axeCorePath, 'utf-8');
    console.log(`[ADA Scanner] Loaded axe-core source (${(axeSource.length / 1024).toFixed(0)}KB)`);
    return axeSource;
}

// ============================================================================
// Node Mapping
// ============================================================================

interface AxeNode {
    html: string;
    target: Array<string | string[]>;
    failureSummary?: string;
    xpath?: Array<string | string[]>;
}

function mapNodes(nodes: AxeNode[]): ADAViolationNode[] {
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

interface AxeResult {
    id: string;
    impact: string | null;
    tags: string[];
    description: string;
    help: string;
    helpUrl: string;
    nodes: AxeNode[];
}

interface AxeResults {
    violations: AxeResult[];
    passes: AxeResult[];
    incomplete: AxeResult[];
    inapplicable: AxeResult[];
}

async function scanPageAtViewport(
    browser: Browser,
    url: string,
    viewport: ViewportSpec,
    config: ADAScanConfig,
): Promise<ADAPageResult> {
    const start = Date.now();
    const page = await browser.newPage();

    try {
        // Set viewport
        await page.setViewport({
            width: viewport.width,
            height: viewport.height,
            isMobile: viewport.isMobile,
            hasTouch: viewport.isMobile,
        });

        // Set user agent
        if (viewport.isMobile) {
            await page.setUserAgent(
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
            );
        }

        console.log(`[ADA Scanner] Navigating to ${url} (${viewport.name} ${viewport.width}x${viewport.height})`);

        const response = await page.goto(url, {
            waitUntil: 'load',
            timeout: config.timeout,
        });

        if (!response) {
            throw new Error(`Failed to load page: no response from ${url}`);
        }

        const statusCode = response.status();
        console.log(`[ADA Scanner] Page loaded: status=${statusCode}`);

        if (statusCode >= 400) {
            throw new Error(`Page returned HTTP ${statusCode}`);
        }

        // Wait for dynamic content
        await new Promise(r => setTimeout(r, 2000));

        // Screenshot
        let screenshotBase64: string | undefined;
        if (config.screenCapture) {
            try {
                const buf = await page.screenshot({ type: 'jpeg', quality: 60 });
                screenshotBase64 = Buffer.from(buf).toString('base64');
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

        console.log(`[ADA Scanner] Injecting axe-core and running analysis...`);

        // Inject axe-core into the page
        const axeSrc = await getAxeSource();
        await page.evaluate(axeSrc);

        // Run axe-core analysis inside the browser
        const axeResults: AxeResults = await page.evaluate((tags: string[]) => {
            return new Promise<AxeResults>((resolve, reject) => {
                // @ts-expect-error axe is injected globally
                if (typeof axe === 'undefined') {
                    reject(new Error('axe-core not loaded'));
                    return;
                }
                // @ts-expect-error axe is injected globally
                axe.run(document, {
                    runOnly: { type: 'tag', values: tags },
                    resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
                }).then(resolve).catch(reject);
            });
        }, wcagTags) as AxeResults;

        console.log(`[ADA Scanner] axe-core results: violations=${axeResults.violations.length}, passes=${axeResults.passes.length}, incomplete=${axeResults.incomplete.length}`);

        // Map violations (errors)
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
                wcagCriteria, wcagLevel, pourPrinciple,
                description: v.description, help: v.help, helpUrl: v.helpUrl,
                seoSynergy,
                seoSynergyNote: seoSynergy ? SEO_SYNERGY_MAP[v.id] : undefined,
                nodes: mapNodes(v.nodes),
            };
        });

        // Map incomplete (warnings)
        const warnings: ADAViolation[] = [];
        const incomplete: ADAIncompleteItem[] = [];
        for (const item of axeResults.incomplete) {
            const wcagCriteria = extractWcagCriteria(item.tags);
            const pourPrinciple = getPourPrinciple(wcagCriteria);
            const wcagLevel = extractWcagLevel(item.tags);
            if (config.includeWarnings) {
                warnings.push({
                    id: item.id,
                    impact: (item.impact as ViolationImpact) || 'moderate',
                    type: 'warning',
                    code: buildIssueCode(wcagLevel, wcagCriteria, item.id),
                    wcagCriteria, wcagLevel, pourPrinciple,
                    description: item.description, help: item.help, helpUrl: item.helpUrl,
                    seoSynergy: item.id in SEO_SYNERGY_MAP,
                    seoSynergyNote: item.id in SEO_SYNERGY_MAP ? SEO_SYNERGY_MAP[item.id] : undefined,
                    nodes: mapNodes(item.nodes),
                });
            }
            incomplete.push({
                id: item.id, description: item.description, help: item.help,
                helpUrl: item.helpUrl,
                impact: (item.impact as ViolationImpact) || null,
                nodes: mapNodes(item.nodes), wcagCriteria, pourPrinciple,
            });
        }

        // Map passes as notices
        const notices: ADAViolation[] = [];
        if (config.includeNotices) {
            for (const pass of axeResults.passes) {
                const wcagCriteria = extractWcagCriteria(pass.tags);
                const wcagLevel = extractWcagLevel(pass.tags);
                notices.push({
                    id: pass.id, impact: 'minor', type: 'notice',
                    code: buildIssueCode(wcagLevel, wcagCriteria, pass.id),
                    wcagCriteria, wcagLevel,
                    pourPrinciple: getPourPrinciple(wcagCriteria),
                    description: pass.description, help: `✓ ${pass.help}`,
                    helpUrl: pass.helpUrl, seoSynergy: false, nodes: [],
                });
            }
        }

        const totalChecks = axeResults.violations.length + axeResults.passes.length
            + axeResults.incomplete.length + axeResults.inapplicable.length;

        return {
            url, viewport: viewport.name,
            viewportWidth: viewport.width, viewportHeight: viewport.height,
            violations, warnings, notices, incomplete,
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
        return {
            url, viewport: viewport.name,
            viewportWidth: viewport.width, viewportHeight: viewport.height,
            violations: [], warnings: [], notices: [], incomplete: [],
            passCount: 0, inapplicableCount: 0, totalChecksRun: 0,
            scanDurationMs: Date.now() - start, scannedAt: Date.now(),
            scanError: errorMsg,
        };
    } finally {
        await page.close();
    }
}

/**
 * Run a full ADA compliance scan on a URL across multiple viewports.
 */
export async function scanPage(config: ADAScanConfig): Promise<ADAPageResult[]> {
    const results: ADAPageResult[] = [];
    const url = config.url.startsWith('http') ? config.url : `https://${config.url}`;

    const viewportsToScan = VIEWPORTS.filter(v => {
        if (v.name === 'desktop' && !config.includeDesktop) return false;
        if (v.name === 'mobile' && !config.includeMobile) return false;
        return true;
    });

    console.log(`[ADA Scanner] Starting scan of ${url} across ${viewportsToScan.length} viewport(s)`);

    // Launch a fresh browser for each scan (no sharing in serverless)
    const browser = await launchBrowser();

    try {
        for (const viewport of viewportsToScan) {
            const result = await scanPageAtViewport(browser, url, viewport, config);
            results.push(result);
            if (result.scanError) {
                console.error(`[ADA Scanner] ${viewport.name}: FAILED — ${result.scanError}`);
            } else {
                console.log(`[ADA Scanner] ${viewport.name}: ${result.violations.length} violations, ${result.passCount} passes, ${result.incomplete.length} incomplete`);
            }
        }
    } finally {
        await closeBrowser(browser);
    }

    return results;
}
