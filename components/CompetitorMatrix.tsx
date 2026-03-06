'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { PageAudit, CoreWebVitals, GapAnalysis, CompetitorData } from '@/lib/types';

interface CompetitorMatrixProps {
    pageAudit: PageAudit;
    vitals?: CoreWebVitals;
    gapAnalyses: GapAnalysis[];
    competitors: CompetitorData[];
}

export default function CompetitorMatrix({
    pageAudit,
    vitals,
    gapAnalyses,
    competitors,
}: CompetitorMatrixProps) {
    if (competitors.length === 0 && gapAnalyses.length === 0) {
        return (
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Swords className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No competitor data available.</p>
                        <p className="text-xs text-slate-400 mt-1">Competitors are identified from SERP results for your keyword.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Build chart data for word count comparison
    const wordCountData = [
        { name: 'Your Site', value: pageAudit.wordCount, fill: '#2563eb' },
        ...gapAnalyses
            .filter((g) => g.competitor.audit)
            .map((g, i) => ({
                name: g.competitor.domain.length > 15
                    ? g.competitor.domain.slice(0, 15) + '…'
                    : g.competitor.domain,
                value: g.competitor.audit!.wordCount,
                fill: ['#f59e0b', '#10b981', '#8b5cf6'][i] || '#94a3b8',
            })),
    ];

    // Build chart data for performance comparison
    const perfData = vitals
        ? [
            { name: 'Your Site', value: vitals.performanceScore, fill: '#2563eb' },
            ...gapAnalyses
                .filter((g) => g.competitor.vitals)
                .map((g, i) => ({
                    name: g.competitor.domain.length > 15
                        ? g.competitor.domain.slice(0, 15) + '…'
                        : g.competitor.domain,
                    value: g.competitor.vitals!.performanceScore,
                    fill: ['#f59e0b', '#10b981', '#8b5cf6'][i] || '#94a3b8',
                })),
        ]
        : [];

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {gapAnalyses.map((gap) => (
                    <Card key={gap.competitor.url} className="border-slate-200 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-xs text-slate-400">Rank #{gap.competitor.position}</p>
                                    <p className="font-semibold text-slate-900 text-sm truncate max-w-[180px]">
                                        {gap.competitor.domain}
                                    </p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${gap.overallAdvantage === 'user' ? 'bg-green-100 text-green-700' :
                                        gap.overallAdvantage === 'competitor' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                    }`}>
                                    {gap.overallAdvantage === 'user' ? 'You Lead' :
                                        gap.overallAdvantage === 'competitor' ? 'They Lead' : 'Mixed'}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mb-1">{gap.contentGap}</p>
                            <p className="text-xs text-slate-400">{gap.technicalGap}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Word Count Chart */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-900">Word Count Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={wordCountData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                                />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                                    {wordCountData.map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Performance Chart */}
                {perfData.length > 0 && (
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold text-slate-900">Performance Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={perfData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                                    />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                                        {perfData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Detailed Metric Table */}
            {gapAnalyses.map((gap, gapIdx) => (
                <Card key={gapIdx} className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Swords className="w-4 h-4 text-blue-600" />
                            You vs. {gap.competitor.domain}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs">Metric</th>
                                        <th className="text-center py-2 px-3 text-blue-600 font-medium text-xs">Your Site</th>
                                        <th className="text-center py-2 px-3 text-amber-600 font-medium text-xs">Competitor</th>
                                        <th className="text-center py-2 px-3 text-slate-500 font-medium text-xs">Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gap.metrics.map((m, i) => (
                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="py-2.5 px-3 font-medium text-slate-700">{m.metric}</td>
                                            <td className="py-2.5 px-3 text-center font-mono">
                                                <span className={m.winner === 'user' ? 'text-green-600 font-semibold' : 'text-slate-600'}>
                                                    {m.userValue}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-mono">
                                                <span className={m.winner === 'competitor' ? 'text-green-600 font-semibold' : 'text-slate-600'}>
                                                    {m.competitorValue}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                {m.winner === 'user' ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                                                        <ArrowUp className="w-3 h-3" /> You
                                                    </span>
                                                ) : m.winner === 'competitor' ? (
                                                    <span className="inline-flex items-center gap-1 text-red-500 text-xs font-semibold">
                                                        <ArrowDown className="w-3 h-3" /> Them
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                                                        <Minus className="w-3 h-3" /> Tie
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
