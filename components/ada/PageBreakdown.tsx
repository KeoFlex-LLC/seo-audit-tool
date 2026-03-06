'use client';

import { useState, useMemo } from 'react';
import {
    ChevronDown,
    ChevronRight,
    FileText,
    AlertTriangle,
    XCircle,
    CheckCircle,
    ArrowUpDown,
    Globe,
    Monitor,
    Smartphone,
} from 'lucide-react';
import type { ADAPageResult, ADAViolation } from '@/lib/ada/types';

interface PageBreakdownProps {
    pageResults: ADAPageResult[];
}

interface PageSummary {
    url: string;
    shortPath: string;
    desktopResult?: ADAPageResult;
    mobileResult?: ADAPageResult;
    totalErrors: number;
    totalWarnings: number;
    totalChecks: number;
    score: number;
    hasError: boolean;
}

type SortKey = 'url' | 'errors' | 'warnings' | 'score';
type SortDir = 'asc' | 'desc';

function computePageScore(results: ADAPageResult[]): number {
    const violations = results.reduce((sum, r) => sum + r.violations.length, 0);
    const passes = results.reduce((sum, r) => sum + r.passCount, 0);
    const total = violations + passes;
    if (total === 0) return 0;
    return Math.round((passes / total) * 100);
}

export default function PageBreakdown({ pageResults }: PageBreakdownProps) {
    const [sortKey, setSortKey] = useState<SortKey>('errors');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

    // Group results by URL
    const pages = useMemo<PageSummary[]>(() => {
        const grouped = new Map<string, ADAPageResult[]>();
        for (const r of pageResults) {
            const existing = grouped.get(r.url) || [];
            existing.push(r);
            grouped.set(r.url, existing);
        }

        return Array.from(grouped.entries()).map(([url, results]) => {
            const desktopResult = results.find(r => r.viewport === 'desktop');
            const mobileResult = results.find(r => r.viewport === 'mobile');
            const totalErrors = results.reduce((sum, r) => sum + r.violations.length, 0);
            const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
            const totalChecks = results.reduce((sum, r) => sum + r.totalChecksRun, 0);
            const hasError = results.some(r => !!r.scanError);

            let shortPath: string;
            try {
                const parsed = new URL(url);
                shortPath = parsed.pathname === '/' ? '/ (homepage)' : parsed.pathname;
            } catch {
                shortPath = url;
            }

            return {
                url, shortPath,
                desktopResult, mobileResult,
                totalErrors, totalWarnings, totalChecks,
                score: hasError ? 0 : computePageScore(results),
                hasError,
            };
        });
    }, [pageResults]);

    const sorted = useMemo(() => {
        return [...pages].sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case 'url': cmp = a.shortPath.localeCompare(b.shortPath); break;
                case 'errors': cmp = a.totalErrors - b.totalErrors; break;
                case 'warnings': cmp = a.totalWarnings - b.totalWarnings; break;
                case 'score': cmp = a.score - b.score; break;
            }
            return sortDir === 'desc' ? -cmp : cmp;
        });
    }, [pages, sortKey, sortDir]);

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir(key === 'score' ? 'asc' : 'desc');
        }
    }

    function getScoreColor(score: number) {
        if (score >= 90) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (score >= 80) return 'bg-cyan-100 text-cyan-700 border-cyan-200';
        if (score >= 70) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (score >= 50) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-red-100 text-red-700 border-red-200';
    }

    const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
        <button
            onClick={() => toggleSort(field)}
            className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${sortKey === field ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                }`}
        >
            {label}
            <ArrowUpDown className="w-3 h-3" />
        </button>
    );

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between px-2 pb-2">
                <p className="text-sm text-slate-500">
                    {pages.length} page{pages.length !== 1 ? 's' : ''} scanned
                    {pages.some(p => p.mobileResult) && ' (homepage: desktop + mobile)'}
                </p>
            </div>

            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 text-left">
                <div className="col-span-5"><SortHeader label="Page" field="url" /></div>
                <div className="col-span-2 text-center"><SortHeader label="Score" field="score" /></div>
                <div className="col-span-2 text-center"><SortHeader label="Errors" field="errors" /></div>
                <div className="col-span-2 text-center"><SortHeader label="Warnings" field="warnings" /></div>
                <div className="col-span-1 text-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</span>
                </div>
            </div>

            {/* Rows */}
            {sorted.map(page => (
                <PageRow
                    key={page.url}
                    page={page}
                    expanded={expandedUrl === page.url}
                    onToggle={() => setExpandedUrl(expandedUrl === page.url ? null : page.url)}
                    getScoreColor={getScoreColor}
                />
            ))}

            {pages.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-500">
                    No pages were scanned.
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Page Row
// =============================================================================

function PageRow({
    page,
    expanded,
    onToggle,
    getScoreColor,
}: {
    page: PageSummary;
    expanded: boolean;
    onToggle: () => void;
    getScoreColor: (score: number) => string;
}) {
    const impactColors: Record<string, string> = {
        critical: 'bg-red-100 text-red-700',
        serious: 'bg-orange-100 text-orange-700',
        moderate: 'bg-amber-100 text-amber-700',
        minor: 'bg-blue-100 text-blue-700',
    };

    // Combine violations from both viewports
    const allViolations = [
        ...(page.desktopResult?.violations || []),
        ...(page.mobileResult?.violations || []),
    ];

    // Dedupe by rule ID (same rule on desktop+mobile counts once)
    const uniqueViolations = new Map<string, ADAViolation>();
    for (const v of allViolations) {
        if (!uniqueViolations.has(v.id)) uniqueViolations.set(v.id, v);
    }

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
                onClick={onToggle}
                className="w-full grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-slate-50 transition-colors text-left"
            >
                <div className="col-span-12 sm:col-span-5 flex items-center gap-2 min-w-0">
                    {expanded
                        ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    }
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-800 truncate">{page.shortPath}</span>
                    {page.mobileResult && (
                        <span className="hidden sm:inline-flex items-center gap-0.5 text-xs text-slate-400">
                            <Monitor className="w-3 h-3" /><Smartphone className="w-3 h-3" />
                        </span>
                    )}
                </div>
                <div className="hidden sm:flex col-span-2 justify-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(page.score)}`}>
                        {page.score}%
                    </span>
                </div>
                <div className="hidden sm:flex col-span-2 justify-center">
                    {page.totalErrors > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-700">
                            <XCircle className="w-3.5 h-3.5" />
                            {page.totalErrors}
                        </span>
                    ) : (
                        <span className="text-sm text-emerald-600">0</span>
                    )}
                </div>
                <div className="hidden sm:flex col-span-2 justify-center">
                    {page.totalWarnings > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {page.totalWarnings}
                        </span>
                    ) : (
                        <span className="text-sm text-slate-400">0</span>
                    )}
                </div>
                <div className="hidden sm:flex col-span-1 justify-center">
                    {page.hasError ? (
                        <span className="text-xs text-red-600 font-medium">Failed</span>
                    ) : page.totalErrors === 0 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                    {page.hasError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-700">
                            {page.desktopResult?.scanError || page.mobileResult?.scanError}
                        </div>
                    )}

                    {uniqueViolations.size === 0 && !page.hasError ? (
                        <p className="text-sm text-emerald-700 text-center py-4">
                            🎉 No violations found on this page!
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {Array.from(uniqueViolations.values())
                                .sort((a, b) => {
                                    const order: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
                                    return (order[a.impact] ?? 3) - (order[b.impact] ?? 3);
                                })
                                .map(v => (
                                    <div key={v.id} className="flex items-start gap-3 bg-white rounded-lg border border-slate-200 p-3">
                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded shrink-0 ${impactColors[v.impact]}`}>
                                            {v.impact}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-800">{v.help}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono text-slate-400">{v.code}</span>
                                                <span className="text-xs text-slate-400">
                                                    · {v.nodes.length} element{v.nodes.length !== 1 ? 's' : ''}
                                                </span>
                                                {v.seoSynergy && (
                                                    <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">SEO</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                        <span>{page.totalChecks} checks run</span>
                        <span>Desktop: {page.desktopResult?.violations.length ?? '—'} errors</span>
                        {page.mobileResult && (
                            <span>Mobile: {page.mobileResult.violations.length} errors</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
