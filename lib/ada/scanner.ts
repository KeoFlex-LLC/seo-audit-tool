// ============================================================================
// KeoFlex ADA Compliance Module — Scanner Engine (Puppeteer + axe-core)
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
        if (match) criteria.push(`${match[1]}.${match[2]}.${match[3]}`);
    }
    return criteria;
}

function extractWcagLevel(tags: string[]): WCAGLevel {
    if (tags.some(t => t === 'wcag2aaa' || t === 'wcag21aaa')) return 'AAA';
    if (tags.some(t => t === 'wcag2aa' || t === 'wcag21aa')) return 'AA';
    return 'A';
}

function getPourPrinciple(criteria: string[]): POURPrinciple {
    for (const c of criteria) { if (WCAG_TO_POUR[c]) return WCAG_TO_POUR[c]; }
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

const CHROMIUM_REMOTE_URL =
    'https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar';

function isServerless(): boolean {
    return !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
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
        const possiblePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium',
        ];
        let localChrome = '';
        const fs = await import('fs');
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) { localChrome = p; break; }
        }
        if (!localChrome) throw new Error('No Chrome found locally. Install Google Chrome.');
        console.log(`[ADA Scanner] Using local Chrome: ${localChrome}`);
        return puppeteer.launch({
            executablePath: localChrome, headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            defaultViewport: null,
        });
    }
}

// ============================================================================
// axe-core source — use the official .source property
// ============================================================================

async function getAxeSource(): Promise<string> {
    // axe-core exports a .source property with the full JS source for injection
    const axeCore = await import('axe-core');
    const source = axeCore.source;
    if (!source || typeof source !== 'string') {
        throw new Error('Failed to load axe-core source');
    }
    console.log(`[ADA Scanner] Loaded axe-core source (${(source.length / 1024).toFixed(0)}KB)`);
    return source;
}

// ============================================================================
// Sitemap Discovery
// ============================================================================

const MAX_PAGES_TO_SCAN = 25; // Cap to stay within Vercel timeout

/**
 * Fetch and parse sitemap.xml to discover pages on a site.
 * Falls back to just the homepage if no sitemap found.
 */
async function discoverPages(baseUrl: string): Promise<string[]> {
    const urls: string[] = [];
    const origin = new URL(baseUrl).origin;

    // Try common sitemap locations
    const sitemapUrls = [
        `${origin}/sitemap.xml`,
        `${origin}/sitemap_index.xml`,
        `${origin}/sitemap/sitemap-index.xml`,
    ];

    for (const sitemapUrl of sitemapUrls) {
        try {
            console.log(`[ADA Scanner] Checking sitemap: ${sitemapUrl}`);
            const res = await fetch(sitemapUrl, {
                headers: { 'User-Agent': 'KeoFlex-ADA-Scanner/1.0' },
                signal: AbortSignal.timeout(5000),
            });

            if (!res.ok) continue;

            const xml = await res.text();

            // Check if it's a sitemap index (contains other sitemaps)
            const sitemapRefs = xml.match(/<sitemap>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/sitemap>/gi);
            if (sitemapRefs && sitemapRefs.length > 0) {
                console.log(`[ADA Scanner] Found sitemap index with ${sitemapRefs.length} sub-sitemaps`);
                // Fetch the first sub-sitemap
                for (const ref of sitemapRefs.slice(0, 3)) {
                    const locMatch = ref.match(/<loc>(.*?)<\/loc>/i);
                    if (locMatch?.[1]) {
                        try {
                            const subRes = await fetch(locMatch[1], {
                                headers: { 'User-Agent': 'KeoFlex-ADA-Scanner/1.0' },
                                signal: AbortSignal.timeout(5000),
                            });
                            if (subRes.ok) {
                                const subXml = await subRes.text();
                                const subUrls = extractUrlsFromSitemap(subXml, origin);
                                urls.push(...subUrls);
                            }
                        } catch { /* skip sub-sitemap */ }
                    }
                }
                break;
            }

            // Regular sitemap
            const pageUrls = extractUrlsFromSitemap(xml, origin);
            if (pageUrls.length > 0) {
                urls.push(...pageUrls);
                console.log(`[ADA Scanner] Found ${pageUrls.length} URLs in sitemap`);
                break;
            }
        } catch (err) {
            console.log(`[ADA Scanner] No sitemap at ${sitemapUrl}`);
        }
    }

    // Always include the provided URL
    if (!urls.includes(baseUrl)) {
        urls.unshift(baseUrl);
    }

    // Cap pages to avoid timeout
    const capped = urls.slice(0, MAX_PAGES_TO_SCAN);
    console.log(`[ADA Scanner] Will scan ${capped.length} page(s) (of ${urls.length} discovered)`);
    return capped;
}

function extractUrlsFromSitemap(xml: string, origin: string): string[] {
    const urls: string[] = [];
    const matches = xml.match(/<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/url>/gi);
    if (!matches) return urls;
    for (const match of matches) {
        const locMatch = match.match(/<loc>(.*?)<\/loc>/i);
        if (locMatch?.[1]) {
            const url = locMatch[1].trim();
            // Only include same-origin URLs
            if (url.startsWith(origin)) {
                urls.push(url);
            }
        }
    }
    return urls;
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

async function scanSinglePage(
    browser: Browser,
    url: string,
    viewport: ViewportSpec,
    config: ADAScanConfig,
    axeSource: string,
): Promise<ADAPageResult> {
    const start = Date.now();
    const page = await browser.newPage();

    try {
        await page.setViewport({
            width: viewport.width, height: viewport.height,
            isMobile: viewport.isMobile, hasTouch: viewport.isMobile,
        });

        if (viewport.isMobile) {
            await page.setUserAgent(
                'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
            );
        }

        console.log(`[ADA Scanner] → ${url} (${viewport.name})`);

        const response = await page.goto(url, { waitUntil: 'load', timeout: config.timeout });
        if (!response) throw new Error(`No response from ${url}`);

        const statusCode = response.status();
        if (statusCode >= 400) throw new Error(`HTTP ${statusCode}`);

        // Wait for dynamic content
        await new Promise(r => setTimeout(r, 2000));

        // Screenshot
        let screenshotBase64: string | undefined;
        if (config.screenCapture) {
            try {
                const buf = await page.screenshot({ type: 'jpeg', quality: 60 });
                screenshotBase64 = Buffer.from(buf).toString('base64');
            } catch { /* ignore */ }
        }

        // Build axe tags
        const wcagTags = ['wcag2a', 'wcag21a'];
        if (config.targetLevel === 'AA' || config.targetLevel === 'AAA') wcagTags.push('wcag2aa', 'wcag21aa');
        if (config.targetLevel === 'AAA') wcagTags.push('wcag2aaa', 'wcag21aaa');
        wcagTags.push('best-practice');

        // Inject and run axe-core
        await page.evaluate(axeSource);

        const axeResults: AxeResults = await page.evaluate((tags: string[]) => {
            return new Promise<AxeResults>((resolve, reject) => {
                // @ts-expect-error axe is injected globally
                if (typeof axe === 'undefined') { reject(new Error('axe-core not loaded')); return; }
                // @ts-expect-error axe is injected globally
                axe.run(document, {
                    runOnly: { type: 'tag', values: tags },
                    resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
                }).then(resolve).catch(reject);
            });
        }, wcagTags) as AxeResults;

        console.log(`[ADA Scanner]   ✓ ${axeResults.violations.length} violations, ${axeResults.passes.length} passes, ${axeResults.incomplete.length} incomplete`);

        // Map violations
        const violations: ADAViolation[] = axeResults.violations.map(v => {
            const wc = extractWcagCriteria(v.tags);
            const wl = extractWcagLevel(v.tags);
            const pp = getPourPrinciple(wc);
            const syn = v.id in SEO_SYNERGY_MAP;
            return {
                id: v.id, impact: (v.impact as ViolationImpact) || 'moderate',
                type: 'error' as IssueType, code: buildIssueCode(wl, wc, v.id),
                wcagCriteria: wc, wcagLevel: wl, pourPrinciple: pp,
                description: v.description, help: v.help, helpUrl: v.helpUrl,
                seoSynergy: syn, seoSynergyNote: syn ? SEO_SYNERGY_MAP[v.id] : undefined,
                nodes: mapNodes(v.nodes),
            };
        });

        // Map incomplete → warnings
        const warnings: ADAViolation[] = [];
        const incomplete: ADAIncompleteItem[] = [];
        for (const item of axeResults.incomplete) {
            const wc = extractWcagCriteria(item.tags);
            const pp = getPourPrinciple(wc);
            const wl = extractWcagLevel(item.tags);
            if (config.includeWarnings) {
                const syn = item.id in SEO_SYNERGY_MAP;
                warnings.push({
                    id: item.id, impact: (item.impact as ViolationImpact) || 'moderate',
                    type: 'warning', code: buildIssueCode(wl, wc, item.id),
                    wcagCriteria: wc, wcagLevel: wl, pourPrinciple: pp,
                    description: item.description, help: item.help, helpUrl: item.helpUrl,
                    seoSynergy: syn, seoSynergyNote: syn ? SEO_SYNERGY_MAP[item.id] : undefined,
                    nodes: mapNodes(item.nodes),
                });
            }
            incomplete.push({
                id: item.id, description: item.description, help: item.help,
                helpUrl: item.helpUrl, impact: (item.impact as ViolationImpact) || null,
                nodes: mapNodes(item.nodes), wcagCriteria: wc, pourPrinciple: pp,
            });
        }

        // Notices
        const notices: ADAViolation[] = [];
        if (config.includeNotices) {
            for (const pass of axeResults.passes) {
                const wc = extractWcagCriteria(pass.tags);
                const wl = extractWcagLevel(pass.tags);
                notices.push({
                    id: pass.id, impact: 'minor', type: 'notice',
                    code: buildIssueCode(wl, wc, pass.id),
                    wcagCriteria: wc, wcagLevel: wl,
                    pourPrinciple: getPourPrinciple(wc),
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
            scanDurationMs: Date.now() - start, scannedAt: Date.now(),
            screenshotBase64,
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[ADA Scanner]   ✗ ${url} (${viewport.name}): ${errorMsg}`);
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

// ============================================================================
// Main Entry Point — scans all pages from sitemap at all viewports
// ============================================================================

export async function scanPage(config: ADAScanConfig): Promise<ADAPageResult[]> {
    const results: ADAPageResult[] = [];
    const baseUrl = config.url.startsWith('http') ? config.url : `https://${config.url}`;

    // Discover pages from sitemap
    const pagesToScan = await discoverPages(baseUrl);

    const viewportsToScan = VIEWPORTS.filter(v => {
        if (v.name === 'desktop' && !config.includeDesktop) return false;
        if (v.name === 'mobile' && !config.includeMobile) return false;
        return true;
    });

    console.log(`[ADA Scanner] Starting scan: ${pagesToScan.length} pages × ${viewportsToScan.length} viewports`);

    // Load axe-core source once
    const axeSource = await getAxeSource();

    // Launch browser
    const browser = await launchBrowser();

    try {
        for (const pageUrl of pagesToScan) {
            // Only scan desktop for non-homepage to save time
            const viewports = pageUrl === baseUrl ? viewportsToScan : viewportsToScan.filter(v => v.name === 'desktop');

            for (const viewport of viewports) {
                const result = await scanSinglePage(browser, pageUrl, viewport, config, axeSource);
                results.push(result);
            }
        }
    } finally {
        try { await browser.close(); } catch { /* ignore */ }
    }

    console.log(`[ADA Scanner] Scan complete: ${results.length} total results`);
    return results;
}
