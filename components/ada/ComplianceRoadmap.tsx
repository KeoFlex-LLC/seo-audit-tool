'use client';

import { useMemo } from 'react';
import {
    CheckCircle2,
    Circle,
    ArrowRight,
    Milestone,
    ExternalLink,
    Zap,
    Crown,
    Shield,
    Star,
} from 'lucide-react';
import type { ADASiteIssue, WCAGLevel, ViolationImpact } from '@/lib/ada/types';

interface ComplianceRoadmapProps {
    siteIssues: ADASiteIssue[];
    complianceScore: number;
    targetLevel: WCAGLevel;
}

interface RoadmapItem {
    issue: ADASiteIssue;
    priority: number;
    effort: 'Quick Fix' | 'Moderate' | 'Complex';
    pointsToGain: number;
}

const IMPACT_PRIORITY: Record<ViolationImpact, number> = {
    critical: 4, serious: 3, moderate: 2, minor: 1,
};

function estimateEffort(issue: ADASiteIssue): RoadmapItem['effort'] {
    if (issue.totalNodes <= 3) return 'Quick Fix';
    if (issue.totalNodes <= 15) return 'Moderate';
    return 'Complex';
}

const EFFORT_COLORS = {
    'Quick Fix': 'bg-emerald-100 text-emerald-700',
    'Moderate': 'bg-amber-100 text-amber-700',
    'Complex': 'bg-red-100 text-red-700',
};

const MILESTONE_THRESHOLDS = [
    { score: 50, label: 'Level A Baseline', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { score: 70, label: 'Good Compliance', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { score: 85, label: 'Level AA Target', icon: Crown, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    { score: 95, label: 'Level AAA Aspiration', icon: Crown, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
];

export default function ComplianceRoadmap({ siteIssues, complianceScore, targetLevel }: ComplianceRoadmapProps) {
    const roadmapItems = useMemo(() => {
        // Sort: critical first, then by page count, then by SEO synergy
        const items: RoadmapItem[] = siteIssues
            .filter(i => i.type === 'error')
            .map(issue => ({
                issue,
                priority: IMPACT_PRIORITY[issue.impact] * 10 + issue.affectedPages + (issue.seoSynergy ? 5 : 0),
                effort: estimateEffort(issue),
                pointsToGain: Math.ceil((IMPACT_PRIORITY[issue.impact] * issue.affectedPages) / Math.max(siteIssues.length, 1) * 15),
            }))
            .sort((a, b) => b.priority - a.priority);
        return items;
    }, [siteIssues]);

    // Calculate running score improvements
    const scoreMilestones = useMemo(() => {
        let runningScore = complianceScore;
        const milestones: { afterIndex: number; milestone: typeof MILESTONE_THRESHOLDS[0] }[] = [];

        for (let i = 0; i < roadmapItems.length; i++) {
            runningScore = Math.min(100, runningScore + roadmapItems[i].pointsToGain);
            for (const ms of MILESTONE_THRESHOLDS) {
                if (runningScore >= ms.score && complianceScore < ms.score && !milestones.some(m => m.milestone.label === ms.label)) {
                    milestones.push({ afterIndex: i, milestone: ms });
                }
            }
        }
        return milestones;
    }, [roadmapItems, complianceScore]);

    if (roadmapItems.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-lg font-semibold text-emerald-700">🏆 No errors to fix!</p>
                <p className="text-sm text-slate-500 mt-1">Your site passes all automated WCAG checks at Level {targetLevel}.</p>
            </div>
        );
    }

    let runningScore = complianceScore;

    return (
        <div className="space-y-1">
            {/* Progress header */}
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-indigo-800">
                        Fix {roadmapItems.length} issue{roadmapItems.length !== 1 ? 's' : ''} to reach full compliance
                    </p>
                    <span className="text-xs text-indigo-600 font-mono">
                        Current: {complianceScore}% → Target: 100%
                    </span>
                </div>
                <div className="w-full h-3 bg-indigo-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                        style={{ width: `${complianceScore}%` }}
                    />
                </div>
            </div>

            {/* Roadmap items */}
            {roadmapItems.map((item, idx) => {
                runningScore = Math.min(100, runningScore + item.pointsToGain);
                const milestoneAfter = scoreMilestones.find(m => m.afterIndex === idx);

                return (
                    <div key={item.issue.ruleId}>
                        {/* Step card */}
                        <div className="flex gap-3 items-start py-3">
                            {/* Timeline */}
                            <div className="flex flex-col items-center shrink-0">
                                <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">
                                    {idx + 1}
                                </div>
                                {idx < roadmapItems.length - 1 && (
                                    <div className="w-0.5 h-full min-h-[24px] bg-slate-200 mt-1" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800">{item.issue.help}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${EFFORT_COLORS[item.effort]}`}>
                                                {item.effort}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {item.issue.affectedPages} page{item.issue.affectedPages !== 1 ? 's' : ''}
                                                {' · '}
                                                {item.issue.totalNodes} element{item.issue.totalNodes !== 1 ? 's' : ''}
                                            </span>
                                            {item.issue.seoSynergy && (
                                                <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                    <Zap className="w-3 h-3" /> SEO boost
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-mono text-emerald-600">+{item.pointsToGain}%</span>
                                        <br />
                                        <span className="text-xs text-slate-400">→ {runningScore}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Milestone marker */}
                        {milestoneAfter && (
                            <div className={`flex items-center gap-2 ml-10 px-3 py-2 rounded-lg border ${milestoneAfter.milestone.bg} mb-1`}>
                                <milestoneAfter.milestone.icon className={`w-4 h-4 ${milestoneAfter.milestone.color}`} />
                                <span className={`text-xs font-semibold ${milestoneAfter.milestone.color}`}>
                                    🎯 Milestone: {milestoneAfter.milestone.label} reached at {runningScore}%
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
