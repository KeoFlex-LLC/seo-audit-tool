'use client';

import { useMemo } from 'react';
import { Target, Zap, Clock, AlertTriangle } from 'lucide-react';
import type { ADASiteIssue } from '@/lib/ada/types';

interface PriorityMatrixProps {
    siteIssues: ADASiteIssue[];
}

interface MatrixItem {
    issue: ADASiteIssue;
    effort: number;   // 0-100 (higher = more effort)
    impact: number;   // 0-100 (higher = more impact)
    quadrant: 'quick-wins' | 'major-projects' | 'easy-fills' | 'deprioritize';
}

const EFFORT_THRESHOLDS = { low: 3, medium: 10 }; // node thresholds
const IMPACT_MAP: Record<string, number> = { critical: 95, serious: 75, moderate: 45, minor: 20 };

function classify(item: MatrixItem): MatrixItem['quadrant'] {
    const highImpact = item.impact >= 50;
    const highEffort = item.effort >= 50;
    if (highImpact && !highEffort) return 'quick-wins';
    if (highImpact && highEffort) return 'major-projects';
    if (!highImpact && !highEffort) return 'easy-fills';
    return 'deprioritize';
}

const QUADRANT_STYLES = {
    'quick-wins': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: '🎯 Quick Wins', desc: 'High impact, low effort — fix these first' },
    'major-projects': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: '🏗️ Major Projects', desc: 'High impact, high effort — plan these' },
    'easy-fills': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: '✅ Easy Fills', desc: 'Low impact, low effort — batch these' },
    'deprioritize': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500', label: '⏳ Deprioritize', desc: 'Low impact, high effort — do last' },
};

const QUADRANT_ORDER: MatrixItem['quadrant'][] = ['quick-wins', 'major-projects', 'easy-fills', 'deprioritize'];

export default function PriorityMatrix({ siteIssues }: PriorityMatrixProps) {
    const items = useMemo<MatrixItem[]>(() => {
        const maxNodes = Math.max(...siteIssues.map(i => i.totalNodes), 1);
        return siteIssues.map(issue => {
            const impact = IMPACT_MAP[issue.impact] || 50;
            // Effort scales with affected elements across pages
            const effort = Math.min(100, Math.round((issue.totalNodes / maxNodes) * 100));
            const item: MatrixItem = { issue, effort, impact, quadrant: 'quick-wins' };
            item.quadrant = classify(item);
            return item;
        });
    }, [siteIssues]);

    const grouped = useMemo(() => {
        const map = new Map<MatrixItem['quadrant'], MatrixItem[]>();
        for (const q of QUADRANT_ORDER) map.set(q, []);
        for (const item of items) {
            map.get(item.quadrant)!.push(item);
        }
        // Sort within each quadrant by impact desc
        for (const [, arr] of map) arr.sort((a, b) => b.impact - a.impact || a.effort - b.effort);
        return map;
    }, [items]);

    if (siteIssues.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-lg font-semibold text-emerald-700">🎉 No issues to prioritize!</p>
                <p className="text-sm text-slate-500 mt-1">All automated checks passed.</p>
            </div>
        );
    }

    const impactColors: Record<string, string> = {
        critical: 'bg-red-100 text-red-700',
        serious: 'bg-orange-100 text-orange-700',
        moderate: 'bg-amber-100 text-amber-700',
        minor: 'bg-blue-100 text-blue-700',
    };

    return (
        <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex flex-wrap gap-3 text-sm">
                {QUADRANT_ORDER.map(q => {
                    const count = grouped.get(q)!.length;
                    const style = QUADRANT_STYLES[q];
                    return (
                        <span key={q} className={`${style.bg} ${style.border} border rounded-lg px-3 py-1.5 font-medium ${style.text}`}>
                            {style.label}: {count}
                        </span>
                    );
                })}
            </div>

            {/* Quadrant cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {QUADRANT_ORDER.map(q => {
                    const qItems = grouped.get(q)!;
                    const style = QUADRANT_STYLES[q];
                    return (
                        <div key={q} className={`${style.bg} ${style.border} border rounded-xl p-4`}>
                            <h4 className={`font-semibold ${style.text} text-sm mb-1`}>{style.label}</h4>
                            <p className="text-xs text-slate-500 mb-3">{style.desc}</p>

                            {qItems.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No issues in this quadrant</p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {qItems.map(item => (
                                        <div key={item.issue.ruleId} className="bg-white rounded-lg border border-slate-100 p-2.5 flex items-start gap-2">
                                            <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${impactColors[item.issue.impact]}`}>
                                                {item.issue.impact}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-slate-800 leading-tight">{item.issue.help}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400">
                                                        {item.issue.affectedPages} pg{item.issue.affectedPages !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {item.issue.totalNodes} elem{item.issue.totalNodes !== 1 ? 's' : ''}
                                                    </span>
                                                    {item.issue.seoSynergy && (
                                                        <span className="text-xs bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded">SEO</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
