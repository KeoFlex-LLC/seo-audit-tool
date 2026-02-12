// ============================================================================
// KeoFlex SEO Audit Tool — SERP & Keyword Ranking Service
// ============================================================================

import type { KeywordAnalysis, SerpResult, SerpFeature } from './types';

/**
 * Fetch SERP results for a keyword.
 * Uses SerpApi if key is available, otherwise returns mock data.
 */
export async function fetchSerpResults(
    keyword: string,
    targetUrl: string
): Promise<KeywordAnalysis> {
    const apiKey = process.env.SERP_API_KEY;

    if (apiKey) {
        return fetchRealSerp(keyword, targetUrl, apiKey);
    }

    console.log('[SERP] No API key configured, using mock data');
    return generateMockSerp(keyword, targetUrl);
}

async function fetchRealSerp(
    keyword: string,
    targetUrl: string,
    apiKey: string
): Promise<KeywordAnalysis> {
    try {
        const params = new URLSearchParams({
            q: keyword,
            api_key: apiKey,
            engine: 'google',
            num: '10',
        });

        const response = await fetch(`https://serpapi.com/search.json?${params}`, {
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            console.warn('[SERP] API error, falling back to mock');
            return generateMockSerp(keyword, targetUrl);
        }

        const data = await response.json();
        return parseSerpResponse(data, keyword, targetUrl);
    } catch (error) {
        console.warn('[SERP] Fetch failed:', error);
        return generateMockSerp(keyword, targetUrl);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSerpResponse(data: any, keyword: string, targetUrl: string): KeywordAnalysis {
    const organicResults = data.organic_results || [];
    const targetDomain = extractDomain(targetUrl);

    const topResults: SerpResult[] = organicResults.slice(0, 10).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any, i: number) => ({
            position: i + 1,
            url: r.link || '',
            title: r.title || '',
            description: r.snippet || '',
            domain: extractDomain(r.link || ''),
        })
    );

    // Find user position
    const userResult = topResults.find((r) => r.domain === targetDomain);
    const userPosition = userResult?.position || null;

    // Detect SERP features
    const serpFeatures: SerpFeature[] = [
        { type: 'ai_overview', present: !!data.ai_overview },
        { type: 'featured_snippet', present: !!data.answer_box || !!data.featured_snippet },
        { type: 'people_also_ask', present: !!data.related_questions },
        { type: 'local_pack', present: !!data.local_results },
        { type: 'video', present: !!data.inline_videos },
        { type: 'images', present: !!data.inline_images },
        { type: 'shopping', present: !!data.shopping_results },
    ];

    const zeroClickRisk = calculateZeroClickRisk(serpFeatures);
    const difficulty = calculateDifficulty(topResults);

    return {
        keyword,
        userPosition,
        totalResults: data.search_information?.total_results || 0,
        serpFeatures,
        topResults,
        zeroClickRisk,
        difficulty,
    };
}

/**
 * Generate realistic mock SERP data for development.
 */
function generateMockSerp(keyword: string, targetUrl: string): KeywordAnalysis {
    const targetDomain = extractDomain(targetUrl);

    // Generate plausible competitor domains
    const competitorDomains = [
        `best-${keyword.split(' ')[0]}.com`,
        `${keyword.split(' ')[0]}hub.io`,
        `top${keyword.split(' ').join('')}.com`,
        'example-competitor-1.com',
        'example-competitor-2.com',
        'wikipedia.org',
        'example-competitor-3.com',
        'example-competitor-4.com',
        'reddit.com',
        'example-competitor-5.com',
    ];

    // Insert user domain at a random but deterministic position
    let hash = 0;
    for (let i = 0; i < targetUrl.length; i++) {
        hash = (hash << 5) - hash + targetUrl.charCodeAt(i);
        hash |= 0;
    }
    const userPos = (Math.abs(hash) % 8) + 2; // position 2-9

    const topResults: SerpResult[] = [];
    let compIdx = 0;

    for (let pos = 1; pos <= 10; pos++) {
        if (pos === userPos) {
            topResults.push({
                position: pos,
                url: targetUrl,
                title: `${keyword} - ${targetDomain}`,
                description: `Explore the best ${keyword} solutions at ${targetDomain}. Professional tools and services available.`,
                domain: targetDomain,
            });
        } else {
            const domain = competitorDomains[compIdx] || `competitor${compIdx}.com`;
            topResults.push({
                position: pos,
                url: `https://${domain}/${keyword.split(' ').join('-')}`,
                title: `${keyword} - ${domain.split('.')[0]}`,
                description: `Discover ${keyword} at ${domain}. Comprehensive solutions for your needs.`,
                domain,
            });
            compIdx++;
        }
    }

    const serpFeatures: SerpFeature[] = [
        { type: 'ai_overview', present: true },
        { type: 'featured_snippet', present: Math.abs(hash) % 3 === 0 },
        { type: 'people_also_ask', present: true },
        { type: 'local_pack', present: Math.abs(hash) % 4 === 0 },
        { type: 'video', present: Math.abs(hash) % 5 === 0 },
        { type: 'images', present: Math.abs(hash) % 2 === 0 },
        { type: 'shopping', present: false },
    ];

    return {
        keyword,
        userPosition: userPos,
        totalResults: 1000000 + (Math.abs(hash) % 9000000),
        serpFeatures,
        topResults,
        zeroClickRisk: calculateZeroClickRisk(serpFeatures),
        difficulty: 'medium',
    };
}

function calculateZeroClickRisk(features: SerpFeature[]): 'low' | 'medium' | 'high' {
    const importantFeatures = features.filter(
        (f) => f.present && ['ai_overview', 'featured_snippet', 'local_pack'].includes(f.type)
    );
    if (importantFeatures.length >= 2) return 'high';
    if (importantFeatures.length === 1) return 'medium';
    return 'low';
}

function calculateDifficulty(results: SerpResult[]): 'easy' | 'medium' | 'hard' {
    const authoritativeDomains = ['wikipedia.org', 'reddit.com', 'amazon.com', 'youtube.com'];
    const authoritative = results.filter((r) =>
        authoritativeDomains.some((d) => r.domain.includes(d))
    );
    if (authoritative.length >= 3) return 'hard';
    if (authoritative.length >= 1) return 'medium';
    return 'easy';
}

function extractDomain(url: string): string {
    try {
        return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
        return url;
    }
}
