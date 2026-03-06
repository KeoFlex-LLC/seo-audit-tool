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

/** Severity weights for score calculation */
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
 * Calculate the overall ADA compliance score (0-100) from scan results.
 *
 * Scoring formula:
 *   weighted_violations = Σ (impact_weight × node_count) for each violation
 *   score = max(0, 100 - (weighted_violations / total_checks) × 100)
 *
 * This ensures critical violations tank the score much more than minor ones.
 */
function calculateComplianceScore(pageResults: ADAPageResult[]): number {
    let totalPasses = 0;
    let weightedViolations = 0;

    for (const result of pageResults) {
        totalPasses += result.passCount;
        for (const violation of result.violations) {
            const weight = IMPACT_WEIGHTS[violation.impact] || 1;
            weightedViolations += weight * violation.nodes.length;
        }
    }

    const totalChecks = totalPasses + weightedViolations;
    if (totalChecks === 0) return 100;

    const score = Math.round((totalPasses / totalChecks) * 100);
    return Math.max(0, Math.min(100, score));
}

/**
 * Map a numeric score to a letter grade.
 */
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

/**
 * Build per-principle pass/fail breakdowns for the dashboard visualization.
 */
function buildPOURBreakdown(pageResults: ADAPageResult[]): POURCategoryScore[] {
    const pourData: Record<POURPrinciple, { violations: number; passes: number }> = {
        perceivable: { violations: 0, passes: 0 },
        operable: { violations: 0, passes: 0 },
        understandable: { violations: 0, passes: 0 },
        robust: { violations: 0, passes: 0 },
    };

    for (const result of pageResults) {
        for (const violation of result.violations) {
            pourData[violation.pourPrinciple].violations += violation.nodes.length;
        }
        // Distribute passes evenly (axe-core doesn't break passes by POUR)
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
            passes: data.passes,
            score,
        };
    });
}

// ============================================================================
// Deduplication
// ============================================================================

/**
 * Group identical violations across pages into site-wide issues.
 * Two violations are "identical" if they share the same axe rule ID.
 */
function deduplicateIssues(pageResults: ADAPageResult[]): ADASiteIssue[] {
    const issueMap = new Map<string, ADASiteIssue>();

    for (const result of pageResults) {
        for (const violation of result.violations) {
            const existing = issueMap.get(violation.id);
            if (existing) {
                existing.affectedPages += 1;
                existing.totalNodes += violation.nodes.length;
            } else {
                issueMap.set(violation.id, {
                    ruleId: violation.id,
                    impact: violation.impact,
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

    // Sort by impact severity (critical first), then by affected pages
    const impactOrder: Record<ViolationImpact, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    return Array.from(issueMap.values()).sort((a, b) => {
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
        for (const violation of result.violations) {
            if (violation.impact === impact) {
                count += violation.nodes.length;
            }
        }
    }
    return count;
}

function countTotalViolations(pageResults: ADAPageResult[]): number {
    let count = 0;
    for (const result of pageResults) {
        for (const violation of result.violations) {
            count += violation.nodes.length;
        }
    }
    return count;
}

// ============================================================================
// Main Analysis Entry Point
// ============================================================================

/**
 * Build a full ADA report from scan results.
 */
export function analyzeADA(
    url: string,
    pageResults: ADAPageResult[],
    targetLevel: WCAGLevel,
): ADAReport {
    const complianceScore = calculateComplianceScore(pageResults);
    const totalDuration = pageResults.reduce((sum, r) => sum + r.scanDurationMs, 0);

    return {
        id: uuidv4(),
        url,
        createdAt: Date.now(),

        complianceScore,
        grade: getGrade(complianceScore),
        targetLevel,

        totalViolations: countTotalViolations(pageResults),
        criticalCount: countByImpact(pageResults, 'critical'),
        seriousCount: countByImpact(pageResults, 'serious'),
        moderateCount: countByImpact(pageResults, 'moderate'),
        minorCount: countByImpact(pageResults, 'minor'),

        pourBreakdown: buildPOURBreakdown(pageResults),
        pageResults,
        siteIssues: deduplicateIssues(pageResults),

        scanDurationMs: totalDuration,
        legalDisclaimer: LEGAL_DISCLAIMER,
    };
}
