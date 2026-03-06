'use client';

import { ExternalLink, Lightbulb, ArrowRight } from 'lucide-react';
import { getRemediation } from '@/lib/ada/remediation';

interface RemediationPanelProps {
    ruleId: string;
    fallbackUrl: string;
}

export default function RemediationPanel({ ruleId, fallbackUrl }: RemediationPanelProps) {
    const entry = getRemediation(ruleId);

    if (!entry) {
        // Fallback to axe-core's help URL
        return (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <a
                    href={fallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-700 font-medium flex items-center gap-1.5 hover:underline"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View remediation guidance on Deque University
                </a>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-indigo-50 to-violet-50 border border-indigo-100 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-indigo-800 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-indigo-600" />
                How to Fix: {entry.title}
            </h4>

            <p className="text-sm text-slate-600">{entry.explanation}</p>

            {/* Before / After code comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <p className="text-xs font-semibold text-red-600 mb-1">❌ Before (incorrect)</p>
                    <pre className="text-xs bg-slate-900 text-red-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        <code>{entry.beforeCode}</code>
                    </pre>
                </div>
                <div>
                    <p className="text-xs font-semibold text-emerald-600 mb-1">✅ After (correct)</p>
                    <pre className="text-xs bg-slate-900 text-emerald-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        <code>{entry.afterCode}</code>
                    </pre>
                </div>
            </div>

            {/* SEO impact note */}
            {entry.seoImpact && (
                <div className="bg-white/60 border border-indigo-100 rounded-lg p-2.5 flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-indigo-700">
                        <strong>SEO Impact:</strong> {entry.seoImpact}
                    </p>
                </div>
            )}

            {/* WCAG reference link */}
            <a
                href={entry.wcagLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"
            >
                <ExternalLink className="w-3 h-3" />
                WCAG 2.1 Reference
            </a>
        </div>
    );
}
