'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from 'lucide-react';
import type { CoreWebVitals } from '@/lib/types';

interface CoreVitalsCardProps {
    vitals?: CoreWebVitals;
}

export default function CoreVitalsCard({ vitals }: CoreVitalsCardProps) {
    if (!vitals) {
        return (
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Gauge className="w-4 h-4 text-blue-600" />
                        Core Web Vitals
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                    <p className="text-sm text-slate-400">Vitals data unavailable</p>
                </CardContent>
            </Card>
        );
    }

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case 'good': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' };
            case 'needs-improvement': return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' };
            case 'poor': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
            default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' };
        }
    };

    const metrics = [
        {
            label: 'LCP',
            fullLabel: 'Largest Contentful Paint',
            value: `${(vitals.lcp / 1000).toFixed(1)}s`,
            rating: vitals.lcpRating,
            target: '< 2.5s',
        },
        {
            label: 'INP',
            fullLabel: 'Interaction to Next Paint',
            value: `${vitals.inp}ms`,
            rating: vitals.inpRating,
            target: '< 200ms',
        },
        {
            label: 'CLS',
            fullLabel: 'Cumulative Layout Shift',
            value: vitals.cls.toFixed(3),
            rating: vitals.clsRating,
            target: '< 0.1',
        },
    ];

    return (
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Gauge className="w-4 h-4 text-blue-600" />
                        Core Web Vitals
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${vitals.performanceScore >= 90 ? 'bg-green-100 text-green-700'
                            : vitals.performanceScore >= 50 ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                        {vitals.performanceScore}/100
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
                {metrics.map((metric) => {
                    const colors = getRatingColor(metric.rating);
                    return (
                        <div
                            key={metric.label}
                            className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                    <span className={`text-sm font-semibold ${colors.text}`}>
                                        {metric.label}
                                    </span>
                                </div>
                                <span className={`text-lg font-bold ${colors.text}`}>
                                    {metric.value}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">{metric.fullLabel}</span>
                                <span className="text-xs text-slate-400">Target: {metric.target}</span>
                            </div>
                        </div>
                    );
                })}

                {/* Additional metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-400">FCP</p>
                        <p className="text-sm font-semibold text-slate-700">{(vitals.fcp / 1000).toFixed(1)}s</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-400">TBT</p>
                        <p className="text-sm font-semibold text-slate-700">{vitals.tbt}ms</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
