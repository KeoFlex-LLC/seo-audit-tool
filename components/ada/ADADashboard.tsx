'use client';

import { useState } from 'react';
import {
    Shield,
    AlertTriangle,
    AlertOctagon,
    Info,
    Eye,
    Hand,
    Brain,
    Cog,
    Zap,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Link2,
    Code,
} from 'lucide-react';
import type { ADAReport } from '@/lib/ada/types';
import ComplianceGauge from './ComplianceGauge';
import ViolationsList from './ViolationsList';
import RemediationPanel from './RemediationPanel';
import SynergyBadge from './SynergyBadge';
import LegalDisclaimer from './LegalDisclaimer';

interface ADADashboardProps {
    report: ADAReport;
}

const POUR_ICONS = {
    perceivable: Eye,
    operable: Hand,
    understandable: Brain,
    robust: Cog,
};

const POUR_COLORS = {
    perceivable: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: 'text-violet-600' },
    operable: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
    understandable: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600' },
    robust: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' },
};

type TabId = 'violations' | 'site-issues' | 'synergy';

export default function ADADashboard({ report }: ADADashboardProps) {
    const [activeTab, setActiveTab] = useState<TabId>('violations');

    const synergyViolations = report.siteIssues.filter(i => i.seoSynergy);

    const tabs: { id: TabId; label: string; count: number }[] = [
        { id: 'violations', label: 'All Violations', count: report.totalViolations },
        { id: 'site-issues', label: 'Site-Wide Issues', count: report.siteIssues.length },
        { id: 'synergy', label: 'SEO Synergy', count: synergyViolations.length },
    ];

    return (
        <div className="space-y-6">
            {/* Legal Disclaimer — always at top */}
            <LegalDisclaimer text={report.legalDisclaimer} />

            {/* Score + Summary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compliance Score Gauge */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center">
                    <ComplianceGauge
                        score={report.complianceScore}
                        grade={report.grade}
                        targetLevel={report.targetLevel}
                    />
                    <p className="text-xs text-slate-400 mt-2">
                        Scanned in {(report.scanDurationMs / 1000).toFixed(1)}s
                    </p>
                </div>

                {/* Severity Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Violations by Severity
                    </h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Critical', count: report.criticalCount, color: 'bg-red-500', textColor: 'text-red-700' },
                            { label: 'Serious', count: report.seriousCount, color: 'bg-orange-500', textColor: 'text-orange-700' },
                            { label: 'Moderate', count: report.moderateCount, color: 'bg-amber-400', textColor: 'text-amber-700' },
                            { label: 'Minor', count: report.minorCount, color: 'bg-blue-400', textColor: 'text-blue-700' },
                        ].map(item => {
                            const pct = report.totalViolations > 0
                                ? (item.count / report.totalViolations) * 100
                                : 0;
                            return (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className={`font-medium ${item.textColor}`}>{item.label}</span>
                                        <span className="text-slate-500">{item.count}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.color} transition-all duration-500`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* POUR Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        POUR Principles
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {report.pourBreakdown.map(pour => {
                            const Icon = POUR_ICONS[pour.principle];
                            const colors = POUR_COLORS[pour.principle];
                            return (
                                <div
                                    key={pour.principle}
                                    className={`${colors.bg} ${colors.border} border rounded-lg p-3`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className={`w-3.5 h-3.5 ${colors.icon}`} />
                                        <span className={`text-xs font-semibold ${colors.text}`}>
                                            {pour.label}
                                        </span>
                                    </div>
                                    <div className={`text-lg font-bold ${colors.text}`}>
                                        {pour.score}%
                                    </div>
                                    <div className={`text-xs ${colors.text} opacity-75`}>
                                        {pour.violations} issue{pour.violations !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                    ? 'text-indigo-700 bg-indigo-50/50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                {tab.label}
                                <span
                                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}
                                >
                                    {tab.count}
                                </span>
                            </span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'violations' && (
                        <ViolationsList
                            pageResults={report.pageResults}
                            showSynergyBadges
                        />
                    )}

                    {activeTab === 'site-issues' && (
                        <div className="space-y-3">
                            {report.siteIssues.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">
                                    No site-wide issues found.
                                </p>
                            ) : (
                                report.siteIssues.map(issue => (
                                    <SiteIssueRow key={issue.ruleId} issue={issue} />
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'synergy' && (
                        <div className="space-y-3">
                            {synergyViolations.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">
                                    No SEO/ADA synergy issues found — great job!
                                </p>
                            ) : (
                                <>
                                    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-indigo-700">
                                            <Zap className="w-4 h-4 inline-block mr-1" />
                                            <strong>These {synergyViolations.length} issues impact both accessibility AND search rankings.</strong>{' '}
                                            Fixing them delivers double value.
                                        </p>
                                    </div>
                                    {synergyViolations.map(issue => (
                                        <SiteIssueRow key={issue.ruleId} issue={issue} showSynergy />
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Sub-component: Site Issue Row
// =============================================================================

import type { ADASiteIssue } from '@/lib/ada/types';

function SiteIssueRow({ issue, showSynergy = false }: { issue: ADASiteIssue; showSynergy?: boolean }) {
    const [expanded, setExpanded] = useState(false);

    const impactColors: Record<string, string> = {
        critical: 'bg-red-100 text-red-700 border-red-200',
        serious: 'bg-orange-100 text-orange-700 border-orange-200',
        moderate: 'bg-amber-100 text-amber-700 border-amber-200',
        minor: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
            >
                {expanded
                    ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                }
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${impactColors[issue.impact]}`}>
                    {issue.impact}
                </span>
                <span className="text-sm font-medium text-slate-800 flex-1 min-w-0 truncate">
                    {issue.help}
                </span>
                {issue.seoSynergy && showSynergy && <SynergyBadge note={issue.seoSynergyNote} />}
                <span className="text-xs text-slate-500 shrink-0">
                    {issue.affectedPages} page{issue.affectedPages !== 1 ? 's' : ''} · {issue.totalNodes} element{issue.totalNodes !== 1 ? 's' : ''}
                </span>
            </button>

            {expanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-3">
                    <p className="text-sm text-slate-600">{issue.description}</p>

                    <div className="flex flex-wrap gap-2">
                        {issue.wcagCriteria.map(c => (
                            <span key={c} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono">
                                WCAG {c}
                            </span>
                        ))}
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">
                            {issue.pourPrinciple}
                        </span>
                    </div>

                    {issue.exampleHtml && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                <Code className="w-3 h-3" /> Failing HTML Example
                            </p>
                            <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto">
                                <code>{issue.exampleHtml}</code>
                            </pre>
                        </div>
                    )}

                    <RemediationPanel ruleId={issue.ruleId} fallbackUrl={issue.helpUrl} />
                </div>
            )}
        </div>
    );
}
