// ============================================================================
// KeoFlex SEO Audit Tool — Enhanced Crawler Service (Phase 3)
// ============================================================================

import * as cheerio from 'cheerio';
import type {
    PageAudit, MetaInfo, HeadingInfo, LinkInfo, ImageInfo,
    SchemaMarkup, SecurityHeaders, AccessibilityInfo, ContentQuality, SocialMeta,
    IndexabilityInfo, EEATSignals, PageBudget, InternalLinkTopology,
    ContentComprehensiveness, RichResultEligibility,
} from './types';

/**
 * Crawl a URL and extract comprehensive SEO data.
 * Uses fetch + Cheerio for parsing. Accepts optional keyword for content quality analysis.
 */
export async function crawlPage(url: string, keyword?: string): Promise<PageAudit> {
    const startTime = Date.now();

    try {
        const targetUrl = normalizeUrl(url);

        // Fetch with full response headers for security analysis
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let response: Response;
        try {
            response = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                redirect: 'follow',
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeoutId);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const loadTimeMs = Date.now() - startTime;

        // --- Core Extractions (Phase 1) ---
        const meta = extractMeta($, targetUrl);
        const headings = extractHeadings($);
        const wordCount = extractWordCount($);
        const { internalLinks, externalLinks } = extractLinks($, targetUrl);
        const images = extractImages($, targetUrl);

        // Check for robots.txt and sitemap
        const baseUrl = new URL(targetUrl).origin;
        const [hasRobotsTxt, hasSitemap] = await Promise.all([
            checkUrlExists(`${baseUrl}/robots.txt`),
            checkUrlExists(`${baseUrl}/sitemap.xml`),
        ]);

        // --- Phase 2 Extractions ---
        const schemaMarkup = extractSchema($);
        const securityHeaders = extractSecurityHeaders(response.headers);
        const accessibility = extractAccessibility($, images);
        const socialMeta = extractSocialMeta($);
        const contentQuality = analyzeContentQuality($, keyword || '', meta, headings);
        const hreflangTags = extractHreflang($);
        const hasCanonicalMismatch = checkCanonicalMismatch(meta.canonical, response.url);

        // Broken link detection (check first 10 internal links)
        const brokenLinks = await checkBrokenLinks(internalLinks.slice(0, 10));

        // --- Phase 3 Extractions ---
        const indexability = extractIndexability($, response, targetUrl);
        const eeat = await extractEEAT($, baseUrl);
        const pageBudget = extractPageBudget($, html);
        const internalLinkTopology = extractInternalLinkTopology(internalLinks, targetUrl);
        const contentComprehensiveness = analyzeContentComprehensiveness($, headings, wordCount);
        const richResults = checkRichResultsEligibility(schemaMarkup);

        return {
            url: targetUrl,
            finalUrl: response.url,
            statusCode: response.status,
            meta,
            headings,
            wordCount,
            internalLinks,
            externalLinks,
            images,
            hasRobotsTxt,
            hasSitemap,
            isHttps: targetUrl.startsWith('https'),
            loadTimeMs,
            crawledAt: Date.now(),
            // Phase 2
            schemaMarkup,
            securityHeaders,
            accessibility,
            contentQuality,
            socialMeta,
            hasCanonicalMismatch,
            hreflangTags,
            brokenLinks,
            // Phase 3
            indexability,
            eeat,
            pageBudget,
            internalLinkTopology,
            contentComprehensiveness,
            richResults,
        };
    } catch (error) {
        const loadTimeMs = Date.now() - startTime;
        throw new CrawlError(
            `Failed to crawl ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            loadTimeMs
        );
    }
}

// ============================================================================
// Phase 1 — Core Helpers
// ============================================================================

function normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
    }
    return url;
}

function extractMeta($: cheerio.CheerioAPI, url: string): MetaInfo {
    const title = $('title').first().text().trim();
    const description = $('meta[name="description"]').attr('content')?.trim() || '';
    const canonical = $('link[rel="canonical"]').attr('href') || undefined;
    const robots = $('meta[name="robots"]').attr('content') || undefined;
    const ogTitle = $('meta[property="og:title"]').attr('content') || undefined;
    const ogDescription = $('meta[property="og:description"]').attr('content') || undefined;
    const ogImage = $('meta[property="og:image"]').attr('content') || undefined;

    return {
        title,
        titleLength: title.length,
        description,
        descriptionLength: description.length,
        canonical,
        robots,
        ogTitle,
        ogDescription,
        ogImage,
    };
}

function extractHeadings($: cheerio.CheerioAPI): HeadingInfo[] {
    const headingMap = new Map<string, { texts: string[]; count: number }>();

    for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
        const elements = $(tag);
        if (elements.length > 0) {
            const texts: string[] = [];
            elements.each((_, el) => {
                texts.push($(el).text().trim());
            });
            headingMap.set(tag, { texts, count: elements.length });
        }
    }

    return Array.from(headingMap.entries()).map(([tag, data]) => ({
        tag,
        text: data.texts.join(' | '),
        count: data.count,
    }));
}

function extractWordCount($: cheerio.CheerioAPI): number {
    const $clone = cheerio.load($.html() || '');
    $clone('script, style, noscript').remove();
    const text = $clone('body').text().trim();
    if (!text) return 0;
    return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function extractLinks(
    $: cheerio.CheerioAPI,
    baseUrl: string
): { internalLinks: LinkInfo[]; externalLinks: LinkInfo[] } {
    const baseDomain = new URL(baseUrl).hostname;
    const internalLinks: LinkInfo[] = [];
    const externalLinks: LinkInfo[] = [];
    const seen = new Set<string>();

    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        try {
            const absoluteUrl = new URL(href, baseUrl).href;
            if (seen.has(absoluteUrl)) return;
            seen.add(absoluteUrl);

            const linkDomain = new URL(absoluteUrl).hostname;
            const link: LinkInfo = { url: absoluteUrl, text: text.slice(0, 100), type: 'internal' };

            if (linkDomain === baseDomain || linkDomain.endsWith(`.${baseDomain}`)) {
                link.type = 'internal';
                internalLinks.push(link);
            } else {
                link.type = 'external';
                externalLinks.push(link);
            }
        } catch {
            // Invalid URL, skip
        }
    });

    return { internalLinks, externalLinks };
}

function extractImages($: cheerio.CheerioAPI, baseUrl: string): ImageInfo[] {
    const images: ImageInfo[] = [];

    $('img').each((_, el) => {
        const src = $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        const loading = $(el).attr('loading');

        let absoluteSrc = src;
        try {
            absoluteSrc = new URL(src, baseUrl).href;
        } catch {
            // keep original
        }

        const format = getImageFormat(absoluteSrc);

        images.push({
            src: absoluteSrc,
            alt,
            hasAlt: alt.length > 0,
            format,
            hasLazyLoading: loading === 'lazy',
        });
    });

    return images;
}

function getImageFormat(url: string): string {
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
    if (!ext) return 'unknown';
    if (['webp', 'avif', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'ico', 'bmp'].includes(ext)) return ext;
    return 'unknown';
}

async function checkUrlExists(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000),
            headers: { 'User-Agent': 'KeoFlexAuditBot/1.0' },
        });
        return response.ok;
    } catch {
        return false;
    }
}

// ============================================================================
// Phase 2 — Enhanced Extractors
// ============================================================================

/** Extract JSON-LD and Microdata schema markup */
function extractSchema($: cheerio.CheerioAPI): SchemaMarkup {
    const types: string[] = [];
    let hasJsonLd = false;
    let hasMicrodata = false;

    // JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
        hasJsonLd = true;
        try {
            const data = JSON.parse($(el).html() || '{}');
            const extractTypes = (obj: Record<string, unknown>) => {
                if (obj['@type']) {
                    const t = obj['@type'];
                    if (Array.isArray(t)) types.push(...t.map(String));
                    else types.push(String(t));
                }
                if (obj['@graph'] && Array.isArray(obj['@graph'])) {
                    for (const item of obj['@graph']) {
                        if (item && typeof item === 'object') extractTypes(item as Record<string, unknown>);
                    }
                }
            };
            extractTypes(data);
        } catch {
            // Malformed JSON-LD
        }
    });

    // Microdata
    const microdataElements = $('[itemtype]');
    if (microdataElements.length > 0) {
        hasMicrodata = true;
        microdataElements.each((_, el) => {
            const itemtype = $(el).attr('itemtype') || '';
            // Extract the type name from schema.org URL
            const typeName = itemtype.split('/').pop();
            if (typeName && !types.includes(typeName)) {
                types.push(typeName);
            }
        });
    }

    return {
        types: [...new Set(types)],
        count: types.length,
        hasJsonLd,
        hasMicrodata,
    };
}

/** Extract security-related HTTP response headers */
function extractSecurityHeaders(headers: Headers): SecurityHeaders {
    const hasHSTS = !!headers.get('strict-transport-security');
    const hasCSP = !!headers.get('content-security-policy');
    const hasXFrameOptions = !!headers.get('x-frame-options');
    const hasXContentType = !!headers.get('x-content-type-options');
    const hasReferrerPolicy = !!headers.get('referrer-policy');
    const hasPermissionsPolicy = !!headers.get('permissions-policy');

    const score = [hasHSTS, hasCSP, hasXFrameOptions, hasXContentType, hasReferrerPolicy, hasPermissionsPolicy]
        .filter(Boolean).length;

    return { hasHSTS, hasCSP, hasXFrameOptions, hasXContentType, hasReferrerPolicy, hasPermissionsPolicy, score };
}

/** Extract accessibility signals */
function extractAccessibility($: cheerio.CheerioAPI, images: ImageInfo[]): AccessibilityInfo {
    const viewport = $('meta[name="viewport"]');
    const htmlLang = $('html').attr('lang') || '';

    // Count form inputs without associated labels
    let formInputsWithoutLabel = 0;
    $('input, select, textarea').each((_, el) => {
        const id = $(el).attr('id');
        const ariaLabel = $(el).attr('aria-label');
        const ariaLabelledBy = $(el).attr('aria-labelledby');
        const type = $(el).attr('type');

        // Skip hidden and submit inputs
        if (type === 'hidden' || type === 'submit' || type === 'button') return;

        if (!ariaLabel && !ariaLabelledBy && (!id || $(`label[for="${id}"]`).length === 0)) {
            formInputsWithoutLabel++;
        }
    });

    return {
        hasViewport: viewport.length > 0,
        viewportContent: viewport.attr('content') || '',
        hasLangAttribute: htmlLang.length > 0,
        langValue: htmlLang,
        imagesWithoutAlt: images.filter(i => !i.hasAlt).length,
        totalImages: images.length,
        formInputsWithoutLabel,
    };
}

/** Extract Open Graph and Twitter Card meta tags */
function extractSocialMeta($: cheerio.CheerioAPI): SocialMeta {
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDesc = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogType = $('meta[property="og:type"]').attr('content');
    const ogUrl = $('meta[property="og:url"]').attr('content');

    const twitterCard = $('meta[name="twitter:card"]').attr('content');
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');

    return {
        ogComplete: !!(ogTitle && ogDesc && ogImage),
        ogType,
        ogUrl,
        twitterCard,
        twitterTitle,
        twitterImage,
        twitterComplete: !!(twitterCard && twitterTitle && twitterImage),
    };
}

/** Analyze content quality — readability and keyword placement */
function analyzeContentQuality(
    $: cheerio.CheerioAPI,
    keyword: string,
    meta: MetaInfo,
    headings: HeadingInfo[]
): ContentQuality {
    // Get clean body text
    const $clone = cheerio.load($.html() || '');
    $clone('script, style, noscript').remove();
    const bodyText = $clone('body').text().trim().toLowerCase();

    // Flesch-Kincaid readability
    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const words = bodyText.split(/\s+/).filter(w => w.length > 0);
    const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

    const sentenceCount = Math.max(sentences.length, 1);
    const wordCount = Math.max(words.length, 1);
    const avgSentenceLength = wordCount / sentenceCount;

    // Flesch-Kincaid Grade Level formula
    const readabilityGrade = Math.max(0,
        0.39 * avgSentenceLength + 11.8 * (syllableCount / wordCount) - 15.59
    );

    // Keyword analysis
    const kw = keyword.toLowerCase();
    const keywordCount = kw ? (bodyText.match(new RegExp(escapeRegex(kw), 'gi'))?.length || 0) : 0;
    const keywordDensity = kw && wordCount > 0
        ? parseFloat(((keywordCount / wordCount) * 100).toFixed(2))
        : 0;

    const h1 = headings.find(h => h.tag === 'h1');

    return {
        readabilityGrade: parseFloat(readabilityGrade.toFixed(1)),
        avgSentenceLength: parseFloat(avgSentenceLength.toFixed(1)),
        keywordCount,
        keywordDensity,
        hasKeywordInTitle: kw ? meta.title.toLowerCase().includes(kw) : false,
        hasKeywordInH1: kw && h1 ? h1.text.toLowerCase().includes(kw) : false,
        hasKeywordInMeta: kw ? meta.description.toLowerCase().includes(kw) : false,
    };
}

/** Extract hreflang tags */
function extractHreflang($: cheerio.CheerioAPI): string[] {
    const tags: string[] = [];
    $('link[rel="alternate"][hreflang]').each((_, el) => {
        const hreflang = $(el).attr('hreflang');
        if (hreflang) tags.push(hreflang);
    });
    return tags;
}

/** Check if canonical URL mismatches the actual URL */
function checkCanonicalMismatch(canonical: string | undefined, actualUrl: string): boolean {
    if (!canonical) return false;
    try {
        const c = new URL(canonical).href.replace(/\/$/, '');
        const a = new URL(actualUrl).href.replace(/\/$/, '');
        return c !== a;
    } catch {
        return false;
    }
}

/** Check internal links for broken (4xx/5xx) responses */
async function checkBrokenLinks(links: LinkInfo[]): Promise<LinkInfo[]> {
    const broken: LinkInfo[] = [];

    const checks = links.map(async (link) => {
        try {
            const res = await fetch(link.url, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000),
                headers: { 'User-Agent': 'KeoFlexAuditBot/1.0' },
                redirect: 'follow',
            });
            if (res.status >= 400) {
                broken.push({ ...link, statusCode: res.status, isBroken: true });
            }
        } catch {
            broken.push({ ...link, statusCode: 0, isBroken: true });
        }
    });

    await Promise.allSettled(checks);
    return broken;
}

// ============================================================================
// Phase 3 — Google Ranking Dominance Extractors
// ============================================================================

/** Extract indexability signals — can Google actually index this page? */
function extractIndexability(
    $: cheerio.CheerioAPI,
    response: Response,
    requestUrl: string
): IndexabilityInfo {
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const xRobotsTag = response.headers.get('x-robots-tag') || '';
    const canonical = $('link[rel="canonical"]').attr('href') || '';

    const hasNoindex = robotsMeta.toLowerCase().includes('noindex') ||
        xRobotsTag.toLowerCase().includes('noindex');
    const hasNofollow = robotsMeta.toLowerCase().includes('nofollow') ||
        xRobotsTag.toLowerCase().includes('nofollow');

    // Canonical status
    let canonicalStatus: 'match' | 'mismatch' | 'missing' = 'missing';
    if (canonical) {
        try {
            const c = new URL(canonical, requestUrl).href.replace(/\/$/, '');
            const a = response.url.replace(/\/$/, '');
            canonicalStatus = c === a ? 'match' : 'mismatch';
        } catch {
            canonicalStatus = 'mismatch';
        }
    }

    // Redirect chain detection
    const hasRedirectChain = response.redirected;
    // We can't get exact redirect count with fetch, estimate from URL mismatch
    const redirectCount = response.url !== requestUrl ? 1 : 0;

    return {
        isIndexable: !hasNoindex,
        robotsDirective: robotsMeta || 'index,follow',
        hasNoindex,
        hasNofollow,
        xRobotsTag,
        canonicalUrl: canonical,
        canonicalStatus,
        hasRedirectChain,
        redirectCount,
    };
}

/** Extract E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals */
async function extractEEAT($: cheerio.CheerioAPI, baseUrl: string): Promise<EEATSignals> {
    const signals: string[] = [];
    let trustScore = 0;

    // Author information detection
    const hasAuthorInfo = !!(
        $('[rel="author"]').length > 0 ||
        $('[class*="author"]').length > 0 ||
        $('[itemprop="author"]').length > 0 ||
        $('meta[name="author"]').attr('content')
    );
    if (hasAuthorInfo) {
        signals.push('Author information found');
        trustScore += 20;
    }

    // Check for about, contact, privacy, terms pages via links
    const allHrefs: string[] = [];
    $('a[href]').each((_, el) => {
        const href = ($(el).attr('href') || '').toLowerCase();
        allHrefs.push(href);
    });
    const footerHrefs: string[] = [];
    $('footer a[href], [class*="footer"] a[href]').each((_, el) => {
        const href = ($(el).attr('href') || '').toLowerCase();
        footerHrefs.push(href);
    });
    const combinedHrefs = [...allHrefs, ...footerHrefs];

    const hasAboutPage = combinedHrefs.some(h =>
        h.includes('/about') || h.includes('/about-us') || h.includes('/who-we-are')
    );
    const hasContactPage = combinedHrefs.some(h =>
        h.includes('/contact') || h.includes('/contact-us') || h.includes('/get-in-touch')
    );
    const hasPrivacyPolicy = combinedHrefs.some(h =>
        h.includes('/privacy') || h.includes('/privacy-policy')
    );
    const hasTermsOfService = combinedHrefs.some(h =>
        h.includes('/terms') || h.includes('/tos') || h.includes('/terms-of-service') || h.includes('/terms-and-conditions')
    );

    if (hasAboutPage) { signals.push('About page linked'); trustScore += 15; }
    if (hasContactPage) { signals.push('Contact page linked'); trustScore += 15; }
    if (hasPrivacyPolicy) { signals.push('Privacy policy linked'); trustScore += 15; }
    if (hasTermsOfService) { signals.push('Terms of service linked'); trustScore += 10; }

    // Check for trust badges / credentials
    const bodyText = $('body').text().toLowerCase();
    if (bodyText.includes('copyright') || $('[class*="copyright"]').length > 0) {
        signals.push('Copyright notice');
        trustScore += 5;
    }
    if ($('address').length > 0 || bodyText.includes('address')) {
        signals.push('Physical address present');
        trustScore += 10;
    }
    if ($('a[href*="linkedin"], a[href*="twitter"], a[href*="facebook"]').length > 0) {
        signals.push('Social media profiles linked');
        trustScore += 10;
    }

    // Extract sameAs from JSON-LD structured data (Knowledge Panel signal)
    const sameAsLinks: string[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const data = JSON.parse($(el).html() || '');
            const extractSameAs = (obj: Record<string, unknown>) => {
                if (obj.sameAs) {
                    if (Array.isArray(obj.sameAs)) {
                        sameAsLinks.push(...obj.sameAs.filter((s): s is string => typeof s === 'string'));
                    } else if (typeof obj.sameAs === 'string') {
                        sameAsLinks.push(obj.sameAs);
                    }
                }
            };
            if (Array.isArray(data)) {
                data.forEach((item) => extractSameAs(item));
            } else {
                extractSameAs(data);
            }
        } catch {
            // Skip malformed JSON-LD
        }
    });
    // Deduplicate
    const uniqueSameAs = [...new Set(sameAsLinks)];
    if (uniqueSameAs.length > 0) {
        signals.push(`sameAs references: ${uniqueSameAs.length} profile(s)`);
        trustScore += 10;
    }

    trustScore = Math.min(trustScore, 100);

    return {
        hasAuthorInfo,
        hasAboutPage,
        hasContactPage,
        hasPrivacyPolicy,
        hasTermsOfService,
        trustScore,
        signals,
        sameAsLinks: uniqueSameAs,
    };
}

/** Extract page resource budget — JS/CSS bloat and render-blocking resources */
function extractPageBudget($: cheerio.CheerioAPI, html: string): PageBudget {
    const scripts = $('script[src]');
    const stylesheets = $('link[rel="stylesheet"]');
    const inlineScripts = $('script:not([src])');

    const scriptCount = scripts.length + inlineScripts.length;
    const stylesheetCount = stylesheets.length;
    const totalResourceCount = scriptCount + stylesheetCount;

    // Estimate render-blocking: scripts without async/defer, stylesheets without media query
    let renderBlockingCount = 0;
    scripts.each((_, el) => {
        const hasAsync = $(el).attr('async') !== undefined;
        const hasDefer = $(el).attr('defer') !== undefined;
        const hasType = $(el).attr('type');
        if (!hasAsync && !hasDefer && hasType !== 'module') {
            renderBlockingCount++;
        }
    });
    stylesheets.each((_, el) => {
        const media = $(el).attr('media');
        if (!media || media === 'all') {
            renderBlockingCount++;
        }
    });

    // Estimate total transfer size from HTML length (rough proxy)
    const totalTransferSizeKb = Math.round(html.length / 1024);
    const hasExcessiveJs = scriptCount > 15 || totalTransferSizeKb > 300;

    return {
        totalResourceCount,
        scriptCount,
        stylesheetCount,
        totalTransferSizeKb,
        renderBlockingCount,
        hasExcessiveJs,
    };
}

/** Analyze internal link topology — structure, anchor distribution, orphan risk */
function extractInternalLinkTopology(
    internalLinks: LinkInfo[],
    currentUrl: string
): InternalLinkTopology {
    const uniqueUrls = new Set(internalLinks.map(l => l.url));
    const selfReferencing = internalLinks.filter(l => {
        try {
            return new URL(l.url).pathname === new URL(currentUrl).pathname;
        } catch { return false; }
    }).length;

    // Anchor text distribution
    const linkDistribution: Record<string, number> = {};
    for (const link of internalLinks) {
        const anchor = link.text.trim().toLowerCase().slice(0, 50) || '[empty]';
        linkDistribution[anchor] = (linkDistribution[anchor] || 0) + 1;
    }

    // Estimate max depth from URL path segments
    let maxLinkDepth = 0;
    for (const link of internalLinks) {
        try {
            const path = new URL(link.url).pathname;
            const depth = path.split('/').filter(Boolean).length;
            if (depth > maxLinkDepth) maxLinkDepth = depth;
        } catch { /* skip */ }
    }

    return {
        uniqueInternalLinks: uniqueUrls.size,
        selfReferencing,
        hasOrphanRisk: internalLinks.length < 3,
        maxLinkDepth,
        linkDistribution,
    };
}

/** Analyze content comprehensiveness — topic depth, FAQ, ToC, entities */
function analyzeContentComprehensiveness(
    $: cheerio.CheerioAPI,
    headings: HeadingInfo[],
    wordCount: number
): ContentComprehensiveness {
    // Topic coverage from headings
    const topicCoverage: string[] = [];
    for (const h of headings) {
        if (h.tag === 'h2' || h.tag === 'h3') {
            // Split combined heading texts
            const topics = h.text.split(' | ').map(t => t.trim()).filter(t => t.length > 2);
            topicCoverage.push(...topics);
        }
    }

    // FAQ detection
    const bodyText = $('body').text().toLowerCase();
    const hasFAQ = !!(
        $('[id*="faq"], [class*="faq"]').length > 0 ||
        bodyText.includes('frequently asked') ||
        bodyText.includes('common questions') ||
        headings.some(h => h.text.toLowerCase().includes('faq') || h.text.toLowerCase().includes('questions'))
    );

    // Table of Contents detection
    const hasTableOfContents = !!(
        $('[id*="toc"], [class*="toc"], [class*="table-of-contents"], [id*="table-of-contents"]').length > 0 ||
        $('nav[aria-label*="content"]').length > 0
    );

    // Count heading-based content sections
    const contentSections = headings.reduce((sum, h) => {
        if (h.tag === 'h2') return sum + h.count;
        return sum;
    }, 0);

    // Estimated read time (avg 250 wpm)
    const estimatedReadTimeMin = Math.max(1, Math.round(wordCount / 250));

    // Entity extraction — find capitalized multi-word terms (proper nouns)
    const $textClone = cheerio.load($.html() || '');
    $textClone('script, style, noscript').remove();
    const cleanText = $textClone('body').text();
    const entityMatches = cleanText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
    const uniqueEntities = new Set(entityMatches.map(e => e.trim()));

    return {
        topicCoverage: topicCoverage.slice(0, 20),
        hasFAQ,
        hasTableOfContents,
        contentSections,
        estimatedReadTimeMin,
        entityCount: uniqueEntities.size,
        missingTopics: [], // populated by competitor comparison later
    };
}

/** Check which Google rich results the page qualifies for based on schema */
function checkRichResultsEligibility(schema: SchemaMarkup): RichResultEligibility {
    const RICH_RESULT_MAP: Record<string, string> = {
        'FAQPage': 'FAQ Rich Result',
        'HowTo': 'How-To Rich Result',
        'Recipe': 'Recipe Card',
        'Product': 'Product Rich Result',
        'Review': 'Review Stars',
        'AggregateRating': 'Star Ratings',
        'BreadcrumbList': 'Breadcrumb Trail',
        'Article': 'Article Rich Result',
        'NewsArticle': 'Top Stories',
        'VideoObject': 'Video Rich Result',
        'Event': 'Event Listing',
        'JobPosting': 'Job Listing',
        'LocalBusiness': 'Local Business Panel',
        'Organization': 'Knowledge Panel',
        'Person': 'People Card',
        'Course': 'Course Listing',
        'SoftwareApplication': 'App Rich Result',
    };

    const eligible: string[] = [];
    const currentSchemaTypes = schema.types;

    for (const type of currentSchemaTypes) {
        if (RICH_RESULT_MAP[type]) {
            eligible.push(RICH_RESULT_MAP[type]);
        }
    }

    // Suggest missing high-impact schema types
    const missing: string[] = [];
    const highImpactTypes = ['FAQPage', 'BreadcrumbList', 'Organization', 'Article', 'HowTo'];
    for (const type of highImpactTypes) {
        if (!currentSchemaTypes.includes(type)) {
            missing.push(`${type} → ${RICH_RESULT_MAP[type]}`);
        }
    }

    const potentialCTRBoost = eligible.length >= 3 ? 'high'
        : eligible.length >= 1 ? 'medium'
            : 'low';

    return {
        eligible,
        missing,
        currentSchemaTypes,
        potentialCTRBoost,
    };
}

// ============================================================================
// Helpers
// ============================================================================

/** Count syllables in a word (rough estimate) */
function countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 2) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
}

/** Escape special regex characters */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// Error Class
// ============================================================================

export class CrawlError extends Error {
    loadTimeMs: number;
    constructor(message: string, loadTimeMs: number) {
        super(message);
        this.name = 'CrawlError';
        this.loadTimeMs = loadTimeMs;
    }
}
