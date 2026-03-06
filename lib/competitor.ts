// ============================================================================
// KeoFlex SEO Audit Tool — Competitor Gap Analysis
// ============================================================================

import type {
    PageAudit,
    CoreWebVitals,
    CompetitorData,
    GapAnalysis,
    GapMetric,
    SerpResult,
} from './types';
import { crawlPage } from './crawler';
import { fetchCoreWebVitals } from './pagespeed';

/**
 * Identify top competitors from SERP results.
 * Returns the top 3 URLs that aren't the user's domain.
 */
export function identifyCompetitors(
    serpResults: SerpResult[],
    userDomain: string,
    limit = 3
): CompetitorData[] {
    return serpResults
        .filter((r) => {
            const domain = r.domain.replace('www.', '');
            const userClean = userDomain.replace('www.', '');
            return domain !== userClean;
        })
        .slice(0, limit)
        .map((r) => ({
            url: r.url,
            domain: r.domain,
            position: r.position,
        }));
}

/**
 * Crawl and analyze a competitor URL.
 */
export async function auditCompetitor(
    competitor: CompetitorData
): Promise<CompetitorData> {
    try {
        const audit = await crawlPage(competitor.url);

        let vitals: CoreWebVitals | undefined;
        try {
            vitals = await fetchCoreWebVitals(competitor.url);
        } catch {
            // Vitals are optional
        }

        return {
            ...competitor,
            audit,
            vitals,
        };
    } catch (error) {
        console.warn(`[Competitor] Failed to audit ${competitor.url}:`, error);
        return competitor; // Return without audit data
    }
}

/**
 * Perform gap analysis between user and competitor.
 */
export function analyzeGap(
    userAudit: PageAudit,
    userVitals: CoreWebVitals | undefined,
    competitor: CompetitorData
): GapAnalysis {
    const metrics: GapMetric[] = [];

    if (competitor.audit) {
        // Word Count
        metrics.push(compareNumeric(
            'Word Count',
            userAudit.wordCount,
            competitor.audit.wordCount,
            'higher-better'
        ));

        // Title Length
        metrics.push(compareNumeric(
            'Title Length',
            userAudit.meta.titleLength,
            competitor.audit.meta.titleLength,
            'closer-to-target',
            50 // ideal title length
        ));

        // Meta Description Length
        metrics.push(compareNumeric(
            'Meta Description Length',
            userAudit.meta.descriptionLength,
            competitor.audit.meta.descriptionLength,
            'closer-to-target',
            155
        ));

        // Heading Count
        const userH2s = userAudit.headings.find((h) => h.tag === 'h2')?.count || 0;
        const compH2s = competitor.audit.headings.find((h) => h.tag === 'h2')?.count || 0;
        metrics.push(compareNumeric('H2 Headings', userH2s, compH2s, 'higher-better'));

        // Internal Links
        metrics.push(compareNumeric(
            'Internal Links',
            userAudit.internalLinks.length,
            competitor.audit.internalLinks.length,
            'higher-better'
        ));

        // Images
        metrics.push(compareNumeric(
            'Image Count',
            userAudit.images.length,
            competitor.audit.images.length,
            'higher-better'
        ));

        // Images with alt text
        const userAltRatio = userAudit.images.length
            ? userAudit.images.filter((i) => i.hasAlt).length / userAudit.images.length
            : 0;
        const compAltRatio = competitor.audit.images.length
            ? competitor.audit.images.filter((i) => i.hasAlt).length / competitor.audit.images.length
            : 0;
        metrics.push(compareNumeric(
            'Alt Text Coverage (%)',
            Math.round(userAltRatio * 100),
            Math.round(compAltRatio * 100),
            'higher-better'
        ));

        // HTTPS
        metrics.push({
            metric: 'HTTPS',
            userValue: userAudit.isHttps ? 'Yes' : 'No',
            competitorValue: competitor.audit.isHttps ? 'Yes' : 'No',
            difference: userAudit.isHttps === competitor.audit.isHttps ? 'Even' : 'Differs',
            winner: userAudit.isHttps && !competitor.audit.isHttps ? 'user'
                : !userAudit.isHttps && competitor.audit.isHttps ? 'competitor'
                    : 'tie',
            severity: !userAudit.isHttps && competitor.audit.isHttps ? 'critical' : 'good',
        });
    }

    // Performance comparison
    if (userVitals && competitor.vitals) {
        metrics.push(compareNumeric(
            'Performance Score',
            userVitals.performanceScore,
            competitor.vitals.performanceScore,
            'higher-better'
        ));

        metrics.push(compareNumeric(
            'LCP (ms)',
            userVitals.lcp,
            competitor.vitals.lcp,
            'lower-better'
        ));

        metrics.push(compareNumeric(
            'CLS',
            userVitals.cls,
            competitor.vitals.cls,
            'lower-better'
        ));
    }

    // Determine overall gaps
    const userWins = metrics.filter((m) => m.winner === 'user').length;
    const compWins = metrics.filter((m) => m.winner === 'competitor').length;
    const overallAdvantage = userWins > compWins ? 'user' : compWins > userWins ? 'competitor' : 'mixed';

    const contentGap = buildContentGapSummary(userAudit, competitor);
    const technicalGap = buildTechnicalGapSummary(metrics);

    return {
        competitor,
        metrics,
        contentGap,
        technicalGap,
        overallAdvantage,
    };
}

// --- Helpers ---

function compareNumeric(
    metric: string,
    userValue: number,
    compValue: number,
    mode: 'higher-better' | 'lower-better' | 'closer-to-target',
    target?: number
): GapMetric {
    const diff = userValue - compValue;

    let winner: 'user' | 'competitor' | 'tie';
    if (mode === 'higher-better') {
        winner = diff > 0 ? 'user' : diff < 0 ? 'competitor' : 'tie';
    } else if (mode === 'lower-better') {
        winner = diff < 0 ? 'user' : diff > 0 ? 'competitor' : 'tie';
    } else {
        // closer-to-target
        const userDist = Math.abs(userValue - (target || 0));
        const compDist = Math.abs(compValue - (target || 0));
        winner = userDist < compDist ? 'user' : userDist > compDist ? 'competitor' : 'tie';
    }

    // Determine severity
    let severity: 'critical' | 'warning' | 'notice' | 'good';
    const ratio = compValue > 0 ? Math.abs(diff) / compValue : Math.abs(diff);
    if (winner === 'competitor' && ratio > 0.5) severity = 'critical';
    else if (winner === 'competitor' && ratio > 0.2) severity = 'warning';
    else if (winner === 'competitor') severity = 'notice';
    else severity = 'good';

    return {
        metric,
        userValue,
        competitorValue: compValue,
        difference: diff > 0 ? `+${diff}` : `${diff}`,
        winner,
        severity,
    };
}

function buildContentGapSummary(userAudit: PageAudit, competitor: CompetitorData): string {
    if (!competitor.audit) return 'Unable to analyze competitor content.';

    const parts: string[] = [];
    const wordDiff = competitor.audit.wordCount - userAudit.wordCount;

    if (wordDiff > 200) {
        parts.push(`Competitor has ${wordDiff} more words of content.`);
    } else if (wordDiff < -200) {
        parts.push(`You have ${Math.abs(wordDiff)} more words than the competitor.`);
    }

    const userH2 = userAudit.headings.find((h) => h.tag === 'h2')?.count || 0;
    const compH2 = competitor.audit.headings.find((h) => h.tag === 'h2')?.count || 0;
    if (compH2 > userH2) {
        parts.push(`Competitor uses ${compH2 - userH2} more H2 sections.`);
    }

    return parts.length > 0 ? parts.join(' ') : 'Content depth is comparable.';
}

function buildTechnicalGapSummary(metrics: GapMetric[]): string {
    const criticals = metrics.filter((m) => m.severity === 'critical' && m.winner === 'competitor');
    if (criticals.length === 0) return 'Technical metrics are competitive.';
    return criticals.map((m) => `${m.metric}: Competitor leads (${m.competitorValue} vs your ${m.userValue})`).join('. ');
}
