// ============================================================================
// POST /api/audit — Run a full audit synchronously and return the result
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { AuditReport, CoreWebVitals, KeywordAnalysis, AIRecommendation } from '@/lib/types';
import { crawlPage } from '@/lib/crawler';
import { analyzeHealth } from '@/lib/analyzer';
import { fetchCoreWebVitals } from '@/lib/pagespeed';
import { fetchSerpResults } from '@/lib/serp';
import { identifyCompetitors, auditCompetitor, analyzeGap } from '@/lib/competitor';
import { generateAIRecommendations } from '@/lib/ai-advisor';

// Allow up to 60s on Vercel Hobby (serverless)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, keyword } = body;

        // Validate inputs
        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }
        if (!keyword || typeof keyword !== 'string') {
            return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
        }

        // Validate URL format
        try {
            new URL(url.startsWith('http') ? url : `https://${url}`);
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        const id = uuidv4();
        const createdAt = Date.now();

        // Step 1: Crawl target URL
        const pageAudit = await crawlPage(url, keyword);

        // Step 2: Fetch Core Web Vitals
        let vitals: CoreWebVitals | undefined;
        try {
            vitals = await fetchCoreWebVitals(url);
        } catch (err) {
            console.warn('[Audit] Vitals fetch failed:', err);
        }

        // Step 3: Calculate health score
        const healthScore = analyzeHealth(pageAudit, vitals);

        // Step 4: SERP & Keyword Analysis
        let keywordAnalysis: KeywordAnalysis | undefined;
        try {
            keywordAnalysis = await fetchSerpResults(keyword, url);
        } catch (err) {
            console.warn('[Audit] SERP fetch failed:', err);
        }

        // Step 5: Crawl Competitors
        const competitorsList = keywordAnalysis
            ? identifyCompetitors(
                keywordAnalysis.topResults,
                new URL(url.startsWith('http') ? url : `https://${url}`).hostname,
                3
            )
            : [];

        const auditedCompetitors = [];
        for (const comp of competitorsList.slice(0, 2)) {
            try {
                const audited = await auditCompetitor(comp);
                auditedCompetitors.push(audited);
            } catch (err) {
                console.warn(`[Audit] Competitor crawl failed for ${comp.url}:`, err);
                auditedCompetitors.push(comp);
            }
        }

        // Step 6: Gap Analysis
        const gapAnalyses = auditedCompetitors
            .filter((c) => c.audit)
            .map((c) => analyzeGap(pageAudit, vitals, c));

        // Step 7: AI Recommendations
        let aiRecommendations: AIRecommendation[];
        try {
            aiRecommendations = await generateAIRecommendations(pageAudit, vitals, gapAnalyses);
        } catch (err) {
            console.warn('[Audit] AI recommendations failed:', err);
            aiRecommendations = [];
        }

        // Build final report
        const report: AuditReport = {
            id,
            url,
            keyword: keyword.trim(),
            createdAt,
            pageAudit,
            healthScore,
            vitals,
            keywordAnalysis,
            competitors: auditedCompetitors,
            gapAnalyses,
            aiRecommendations,
        };

        return NextResponse.json({ jobId: id, report }, { status: 200 });
    } catch (error) {
        console.error('[API] Audit error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Audit failed' },
            { status: 500 }
        );
    }
}
