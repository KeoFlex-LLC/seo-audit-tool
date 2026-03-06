'use client';

import { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Monitor,
    Smartphone,
    Code,
    ExternalLink,
} from 'lucide-react';
import type { ADAPageResult, ADAViolation } from '@/lib/ada/types';
import SynergyBadge from './SynergyBadge';
import RemediationPanel from './RemediationPanel';

interface ViolationsListProps {
    pageResults: ADAPageResult[];
    showSynergyBadges?: boolean;
}

const impactColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    serious: 'bg-orange-100 text-orange-700 border-orange-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    minor: 'bg-blue-100 text-blue-700 border-blue-200',
};

const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };

export default function ViolationsList({ pageResults, showSynergyBadges = true }: ViolationsListProps) {
    // Group violations by viewport
    const desktopResults = pageResults.filter(r => r.viewport === 'desktop');
    const mobileResults = pageResults.filter(r => r.viewport === 'mobile');

    const [viewportTab, setViewportTab] = useState<'desktop' | 'mobile'>(
        desktopResults.length > 0 ? 'desktop' : 'mobile',
    );

    const activeResults = viewportTab === 'desktop' ? desktopResults : mobileResults;

    // Flatten and sort violations
    const allViolations = activeResults
        .flatMap(r => r.violations)
        .sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

    return (
        <div className="space-y-4">
            {/* Viewport toggle */}
            {desktopResults.length > 0 && mobileResults.length > 0 && (
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewportTab('desktop')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewportTab === 'desktop'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Monitor className="w-3.5 h-3.5" />
                        Desktop
                        <span className="text-xs opacity-75">
                            ({desktopResults.reduce((sum, r) => sum + r.violations.length, 0)})
                        </span>
                    </button>
                    <button
                        onClick={() => setViewportTab('mobile')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewportTab === 'mobile'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Smartphone className="w-3.5 h-3.5" />
                        Mobile
                        <span className="text-xs opacity-75">
                            ({mobileResults.reduce((sum, r) => sum + r.violations.length, 0)})
                        </span>
                    </button>
                </div>
            )}

            {/* Violations list */}
            {allViolations.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-lg font-semibold text-emerald-700">🎉 No violations found!</p>
                    <p className="text-sm text-slate-500 mt-1">
                        This page passes all automated WCAG {activeResults[0]?.viewport || ''} checks.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {allViolations.map((violation, idx) => (
                        <ViolationRow
                            key={`${violation.id}-${idx}`}
                            violation={violation}
                            showSynergy={showSynergyBadges}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Single Violation Row
// =============================================================================

function ViolationRow({ violation, showSynergy }: { violation: ADAViolation; showSynergy: boolean }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
            >
                {expanded
                    ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                }
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${impactColors[violation.impact]}`}>
                    {violation.impact}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                        {violation.help}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {violation.wcagCriteria.map(c => (
                            <span key={c} className="text-xs text-indigo-600 font-mono">
                                {c}
                            </span>
                        ))}
                        <span className="text-xs text-slate-400">
                            · {violation.nodes.length} element{violation.nodes.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                {showSynergy && violation.seoSynergy && (
                    <SynergyBadge note={violation.seoSynergyNote} />
                )}
            </button>

            {expanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-4">
                    <p className="text-sm text-slate-600">{violation.description}</p>

                    {/* Affected elements */}
                    <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                            <Code className="w-3 h-3" />
                            Affected Elements ({violation.nodes.length})
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {violation.nodes.slice(0, 10).map((node, i) => (
                                <div key={i} className="bg-slate-900 rounded-lg p-3">
                                    <pre className="text-xs text-slate-100 overflow-x-auto whitespace-pre-wrap">
                                        <code>{node.html}</code>
                                    </pre>
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                        {node.target.map((t, j) => (
                                            <span key={j} className="text-xs text-cyan-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                    {node.failureSummary && (
                                        <p className="text-xs text-amber-300 mt-1.5">{node.failureSummary}</p>
                                    )}
                                </div>
                            ))}
                            {violation.nodes.length > 10 && (
                                <p className="text-xs text-slate-400 text-center py-2">
                                    + {violation.nodes.length - 10} more elements
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Remediation */}
                    <RemediationPanel ruleId={violation.id} fallbackUrl={violation.helpUrl} />
                </div>
            )}
        </div>
    );
}
