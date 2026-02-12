'use client';

import {
    BookOpen,
    Target,
    CheckCircle2,
    XCircle,
    Gauge,
} from 'lucide-react';
import type { ContentQuality } from '@/lib/types';

interface ContentQualityCardProps {
    quality: ContentQuality;
    wordCount: number;
}

export default function ContentQualityCard({ quality, wordCount }: ContentQualityCardProps) {
    const readabilityLabel = getReadabilityLabel(quality.readabilityGrade);
    const readabilityColor = getReadabilityColor(quality.readabilityGrade);
    const densityLabel = getDensityLabel(quality.keywordDensity);
    const densityColor = getDensityColor(quality.keywordDensity);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Content Quality
            </h3>

            {/* Readability + Keyword Density gauges */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <Gauge className={`w-5 h-5 mx-auto mb-1 ${readabilityColor}`} />
                    <p className={`text-lg font-bold ${readabilityColor}`}>
                        {quality.readabilityGrade > 0 ? `Grade ${quality.readabilityGrade}` : 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500">Readability</p>
                    <p className={`text-xs font-medium ${readabilityColor} mt-0.5`}>{readabilityLabel}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <Target className={`w-5 h-5 mx-auto mb-1 ${densityColor}`} />
                    <p className={`text-lg font-bold ${densityColor}`}>
                        {quality.keywordDensity > 0 ? `${quality.keywordDensity}%` : '0%'}
                    </p>
                    <p className="text-xs text-slate-500">Keyword Density</p>
                    <p className={`text-xs font-medium ${densityColor} mt-0.5`}>{densityLabel}</p>
                </div>
            </div>

            {/* Keyword Placement Checks */}
            <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Keyword Placement</p>
                <KeywordCheck label="In Title Tag" pass={quality.hasKeywordInTitle} />
                <KeywordCheck label="In H1 Heading" pass={quality.hasKeywordInH1} />
                <KeywordCheck label="In Meta Description" pass={quality.hasKeywordInMeta} />
                <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded">
                    <span className="text-slate-600">Keyword Mentions</span>
                    <span className="font-semibold text-slate-900">{quality.keywordCount}x</span>
                </div>
                <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded">
                    <span className="text-slate-600">Avg. Sentence Length</span>
                    <span className="font-semibold text-slate-900">{quality.avgSentenceLength} words</span>
                </div>
            </div>
        </div>
    );
}

function KeywordCheck({ label, pass }: { label: string; pass: boolean }) {
    return (
        <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded">
            <span className="text-slate-600">{label}</span>
            {pass ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
                <XCircle className="w-4 h-4 text-red-400" />
            )}
        </div>
    );
}

function getReadabilityLabel(grade: number): string {
    if (grade <= 0) return 'Not enough text';
    if (grade <= 6) return 'Easy';
    if (grade <= 9) return 'Average';
    if (grade <= 12) return 'Moderate';
    return 'Difficult';
}

function getReadabilityColor(grade: number): string {
    if (grade <= 0) return 'text-slate-400';
    if (grade <= 9) return 'text-emerald-600';
    if (grade <= 12) return 'text-amber-600';
    return 'text-red-600';
}

function getDensityLabel(density: number): string {
    if (density === 0) return 'Not found';
    if (density < 0.5) return 'Very Low';
    if (density <= 3) return 'Optimal';
    if (density <= 5) return 'High';
    return 'Over-optimized';
}

function getDensityColor(density: number): string {
    if (density === 0) return 'text-red-500';
    if (density < 0.5) return 'text-amber-600';
    if (density <= 3) return 'text-emerald-600';
    if (density <= 5) return 'text-amber-600';
    return 'text-red-600';
}
