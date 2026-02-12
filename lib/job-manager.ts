// ============================================================================
// KeoFlex SEO Audit Tool — In-Memory Job Manager
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { AuditJob, AuditStep, AuditReport, CoreWebVitals, KeywordAnalysis, AIRecommendation } from './types';
import { crawlPage } from './crawler';
import { analyzeHealth } from './analyzer';
import { fetchCoreWebVitals } from './pagespeed';
import { fetchSerpResults } from './serp';
import { identifyCompetitors, auditCompetitor, analyzeGap } from './competitor';
import { generateAIRecommendations } from './ai-advisor';

// --- In-Memory Job Store (survives HMR reloads in dev) ---
const globalForJobs = globalThis as typeof globalThis & {
    __siteaudit_jobs?: Map<string, AuditJob>;
};
if (!globalForJobs.__siteaudit_jobs) {
    globalForJobs.__siteaudit_jobs = new Map<string, AuditJob>();
}
const jobs = globalForJobs.__siteaudit_jobs;

const STEP_LABELS = [
    'Crawling target URL',
    'Analyzing page health',
    'Fetching Core Web Vitals',
    'Searching keywords',
    'Crawling competitors',
    'Comparing metrics',
    'Generating recommendations',
];

function createSteps(): AuditStep[] {
    return STEP_LABELS.map((label) => ({
        label,
        status: 'pending' as const,
    }));
}

function markStep(job: AuditJob, index: number, status: AuditStep['status'], error?: string) {
    if (job.steps[index]) {
        job.steps[index].status = status;
        if (status === 'running') job.steps[index].startedAt = Date.now();
        if (status === 'completed' || status === 'failed') job.steps[index].completedAt = Date.now();
        if (error) job.steps[index].error = error;
    }
    job.updatedAt = Date.now();
}

/**
 * Create a new audit job and start processing in the background.
 */
export function createAuditJob(url: string, keyword: string): string {
    const id = uuidv4();
    const job: AuditJob = {
        id,
        url,
        keyword,
        status: 'queued',
        steps: createSteps(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    jobs.set(id, job);

    // Fire and forget — run the audit pipeline in the background
    processAudit(job).catch((err) => {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : 'Unknown error';
        job.updatedAt = Date.now();
    });

    return id;
}

/**
 * Get the current state of a job.
 */
export function getAuditJob(id: string): AuditJob | undefined {
    return jobs.get(id);
}

/**
 * Main audit pipeline — runs all steps sequentially.
 */
async function processAudit(job: AuditJob): Promise<void> {
    try {
        // Step 1: Crawl target URL
        job.status = 'crawling';
        markStep(job, 0, 'running');
        const pageAudit = await crawlPage(job.url, job.keyword);
        markStep(job, 0, 'completed');

        // Step 2: Analyze health
        job.status = 'analyzing';
        markStep(job, 1, 'running');
        // We'll need vitals for health analysis, but let's get them in next step
        // For now, analyze without vitals (will update after)
        markStep(job, 1, 'completed');

        // Step 3: Fetch Core Web Vitals
        job.status = 'fetching-vitals';
        markStep(job, 2, 'running');
        let vitals: CoreWebVitals | undefined;
        try {
            vitals = await fetchCoreWebVitals(job.url);
        } catch (err) {
            console.warn('[Audit] Vitals fetch failed:', err);
        }
        markStep(job, 2, 'completed');

        // Now calculate health with vitals
        const healthScore = analyzeHealth(pageAudit, vitals);

        // Step 4: SERP & Keyword Analysis
        job.status = 'fetching-serp';
        markStep(job, 3, 'running');
        let keywordAnalysis: KeywordAnalysis | undefined;
        try {
            keywordAnalysis = await fetchSerpResults(job.keyword, job.url);
        } catch (err) {
            console.warn('[Audit] SERP fetch failed:', err);
        }
        markStep(job, 3, 'completed');

        // Step 5: Crawl Competitors
        job.status = 'crawling-competitors';
        markStep(job, 4, 'running');
        const competitorsList = keywordAnalysis
            ? identifyCompetitors(keywordAnalysis.topResults, new URL(
                job.url.startsWith('http') ? job.url : `https://${job.url}`
            ).hostname, 3)
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
        markStep(job, 4, 'completed');

        // Step 6: Gap Analysis
        markStep(job, 5, 'running');
        const gapAnalyses = auditedCompetitors
            .filter((c) => c.audit)
            .map((c) => analyzeGap(pageAudit, vitals, c));
        markStep(job, 5, 'completed');

        // Step 7: AI Recommendations
        job.status = 'generating-ai';
        markStep(job, 6, 'running');
        let aiRecommendations: AIRecommendation[];
        try {
            aiRecommendations = await generateAIRecommendations(pageAudit, vitals, gapAnalyses);
        } catch (err) {
            console.warn('[Audit] AI recommendations failed:', err);
            aiRecommendations = [];
        }
        markStep(job, 6, 'completed');

        // Build final report
        const report: AuditReport = {
            id: job.id,
            url: job.url,
            keyword: job.keyword,
            createdAt: job.createdAt,
            pageAudit,
            healthScore,
            vitals,
            keywordAnalysis,
            competitors: auditedCompetitors,
            gapAnalyses,
            aiRecommendations,
        };

        job.report = report;
        job.status = 'completed';
        job.updatedAt = Date.now();
    } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'An unexpected error occurred';
        job.updatedAt = Date.now();

        // Mark any running steps as failed
        for (const step of job.steps) {
            if (step.status === 'running') {
                step.status = 'failed';
                step.completedAt = Date.now();
            }
        }
    }
}
