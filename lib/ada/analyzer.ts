// ============================================================================
// KeoFlex ADA Compliance Module — Scoring & Deduplication Analyzer
// ============================================================================

import type {
    ADAPageResult,
    ADAReport,
    ADASiteIssue,
    POURCategoryScore,
    POURPrinciple,
    WCAGLevel,
    ViolationImpact,
    IssueType,
} from './types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Constants
// ============================================================================

const LEGAL_DISCLAIMER =
    'This automated scan detects approximately 30–40% of WCAG 2.1 violations. ' +
    'Full ADA compliance requires manual testing with assistive technologies ' +
    '(screen readers, keyboard-only navigation). This report does not constitute ' +
    'legal certification of ADA compliance.';

const IMPACT_WEIGHTS: Record<ViolationImpact, number> = {
    critical: 10,
    serious: 5,
    moderate: 2,
    minor: 1,
};

const POUR_LABELS: Record<POURPrinciple, string> = {
    perceivable: 'Perceivable',
    operable: 'Operable',
    understandable: 'Understandable',
    robust: 'Robust',
};

// ============================================================================
// Scoring
// ============================================================================

/**
 * Calculate compliance score (0-100).
 *
 * If a scan had errors (scanError set), the score accounts for that
 * by not inflating from missing data.
 */
function calculateComplianceScore(pageResults: ADAPageResult[]): number {
    let totalPasses = 0;
    let weightedViolations = 0;
    let hasValidScan = false;

    for (const result of pageResults) {
        // Skip failed scans — don't let them inflate the score
        if (result.scanError) continue;

        hasValidScan = true;
        totalPasses += result.passCount;

        for (const violation of result.violations) {
            const weight = IMPACT_WEIGHTS[violation.impact] || 1;
            weightedViolations += weight * violation.nodes.length;
        }
    }

    // If no valid scans completed, return 0 (not 100!)
    if (!hasValidScan) return 0;

    const totalChecks = totalPasses + weightedViolations;
    if (totalChecks === 0) return 0; // No data = 0, not 100

    const score = Math.round((totalPasses / totalChecks) * 100);
    return Math.max(0, Math.min(100, score));
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

// ============================================================================
// POUR Breakdown
// ============================================================================

function buildPOURBreakdown(pageResults: ADAPageResult[]): POURCategoryScore[] {
    const pourData: Record<POURPrinciple, { violations: number; warnings: number; passes: number }> = {
        perceivable: { violations: 0, warnings: 0, passes: 0 },
        operable: { violations: 0, warnings: 0, passes: 0 },
        understandable: { violations: 0, warnings: 0, passes: 0 },
        robust: { violations: 0, warnings: 0, passes: 0 },
    };

    for (const result of pageResults) {
        if (result.scanError) continue;

        for (const violation of result.violations) {
            pourData[violation.pourPrinciple].violations += violation.nodes.length;
        }
        for (const warning of result.warnings) {
            pourData[warning.pourPrinciple].warnings += warning.nodes.length;
        }
        const passPerPour = Math.floor(result.passCount / 4);
        for (const key of Object.keys(pourData) as POURPrinciple[]) {
            pourData[key].passes += passPerPour;
        }
    }

    return (Object.keys(pourData) as POURPrinciple[]).map(principle => {
        const data = pourData[principle];
        const total = data.passes + data.violations;
        const score = total === 0 ? 100 : Math.round((data.passes / total) * 100);
        return {
            principle,
            label: POUR_LABELS[principle],
            violations: data.violations,
            warnings: data.warnings,
            passes: data.passes,
            score,
        };
    });
}

// ============================================================================
// Deduplication
// ============================================================================

function deduplicateIssues(pageResults: ADAPageResult[]): ADASiteIssue[] {
    const issueMap = new Map<string, ADASiteIssue>();

    for (const result of pageResults) {
        if (result.scanError) continue;

        // Include both violations (errors) and warnings
        const allIssues = [
            ...result.violations,
            ...result.warnings,
        ];

        for (const violation of allIssues) {
            const existing = issueMap.get(violation.id);
            if (existing) {
                existing.affectedPages += 1;
                existing.totalNodes += violation.nodes.length;
            } else {
                issueMap.set(violation.id, {
                    ruleId: violation.id,
                    impact: violation.impact,
                    type: violation.type,
                    code: violation.code,
                    description: violation.description,
                    help: violation.help,
                    helpUrl: violation.helpUrl,
                    pourPrinciple: violation.pourPrinciple,
                    wcagCriteria: violation.wcagCriteria,
                    wcagLevel: violation.wcagLevel,
                    affectedPages: 1,
                    totalNodes: violation.nodes.length,
                    exampleHtml: violation.nodes[0]?.html || '',
                    exampleTarget: violation.nodes[0]?.target || [],
                    seoSynergy: violation.seoSynergy,
                    seoSynergyNote: violation.seoSynergyNote,
                });
            }
        }
    }

    const impactOrder: Record<ViolationImpact, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    const typeOrder: Record<IssueType, number> = { error: 0, warning: 1, notice: 2 };

    return Array.from(issueMap.values()).sort((a, b) => {
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        if (typeDiff !== 0) return typeDiff;
        const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
        if (impactDiff !== 0) return impactDiff;
        return b.affectedPages - a.affectedPages;
    });
}

// ============================================================================
// Count Helpers
// ============================================================================

function countByImpact(pageResults: ADAPageResult[], impact: ViolationImpact): number {
    let count = 0;
    for (const result of pageResults) {
        if (result.scanError) continue;
        for (const v of result.violations) {
            if (v.impact === impact) count += v.nodes.length;
        }
    }
    return count;
}

function countTotalViolations(pageResults: ADAPageResult[]): number {
    let count = 0;
    for (const result of pageResults) {
        if (result.scanError) continue;
        for (const v of result.violations) count += v.nodes.length;
    }
    return count;
}

function countTotalWarnings(pageResults: ADAPageResult[]): number {
    let count = 0;
    for (const result of pageResults) {
        if (result.scanError) continue;
        for (const w of result.warnings) count += w.nodes.length;
    }
    return count;
}

function countTotalNotices(pageResults: ADAPageResult[]): number {
    let count = 0;
    for (const result of pageResults) {
        if (result.scanError) continue;
        count += result.notices.length;
    }
    return count;
}

function countTotalIncomplete(pageResults: ADAPageResult[]): number {
    let count = 0;
    for (const result of pageResults) {
        if (result.scanError) continue;
        count += result.incomplete.length;
    }
    return count;
}

function countTotalChecks(pageResults: ADAPageResult[]): number {
    let count = 0;
    for (const result of pageResults) {
        if (result.scanError) continue;
        count += result.totalChecksRun;
    }
    return count;
}

// ============================================================================
// Main Analysis Entry Point
// ============================================================================

export function analyzeADA(
    url: string,
    pageResults: ADAPageResult[],
    targetLevel: WCAGLevel,
): ADAReport {
    const complianceScore = calculateComplianceScore(pageResults);
    const totalDuration = pageResults.reduce((sum, r) => sum + r.scanDurationMs, 0);

    // Collect any scan errors
    const scanErrors = pageResults
        .filter(r => r.scanError)
        .map(r => `${r.viewport}: ${r.scanError}`);

    return {
        id: uuidv4(),
        url,
        createdAt: Date.now(),

        complianceScore,
        grade: getGrade(complianceScore),
        targetLevel,

        totalViolations: countTotalViolations(pageResults),
        totalWarnings: countTotalWarnings(pageResults),
        totalNotices: countTotalNotices(pageResults),
        totalIncomplete: countTotalIncomplete(pageResults),
        criticalCount: countByImpact(pageResults, 'critical'),
        seriousCount: countByImpact(pageResults, 'serious'),
        moderateCount: countByImpact(pageResults, 'moderate'),
        minorCount: countByImpact(pageResults, 'minor'),
        totalChecksRun: countTotalChecks(pageResults),

        pourBreakdown: buildPOURBreakdown(pageResults),
        pageResults,
        siteIssues: deduplicateIssues(pageResults),

        scanDurationMs: totalDuration,
        legalDisclaimer: LEGAL_DISCLAIMER,
        scanErrors,
    };
}
