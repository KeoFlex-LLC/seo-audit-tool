'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { KeywordAnalysis } from '@/lib/types';

interface KeywordRankingCardProps {
    keywordAnalysis?: KeywordAnalysis;
}

export default function KeywordRankingCard({ keywordAnalysis }: KeywordRankingCardProps) {
    if (!keywordAnalysis) {
        return (
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Target className="w-4 h-4 text-blue-600" />
                        Keyword Ranking
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                    <p className="text-sm text-slate-400">Keyword data unavailable</p>
                </CardContent>
            </Card>
        );
    }

    const { keyword, userPosition, serpFeatures, zeroClickRisk, difficulty, topResults } = keywordAnalysis;

    return (
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Target className="w-4 h-4 text-blue-600" />
                    Keyword Ranking
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
                {/* Keyword + Position */}
                <div className="text-center mb-5">
                    <p className="text-xs text-slate-400 mb-1">Target Keyword</p>
                    <p className="text-base font-semibold text-slate-900 mb-3">&quot;{keyword}&quot;</p>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${userPosition && userPosition <= 3 ? 'bg-green-50 border border-green-200' :
                            userPosition && userPosition <= 10 ? 'bg-blue-50 border border-blue-200' :
                                userPosition ? 'bg-amber-50 border border-amber-200' :
                                    'bg-slate-50 border border-slate-200'
                        }`}>
                        <TrendingUp className={`w-4 h-4 ${userPosition && userPosition <= 3 ? 'text-green-600' :
                                userPosition && userPosition <= 10 ? 'text-blue-600' :
                                    'text-amber-600'
                            }`} />
                        <span className={`text-2xl font-bold ${userPosition && userPosition <= 3 ? 'text-green-700' :
                                userPosition && userPosition <= 10 ? 'text-blue-700' :
                                    userPosition ? 'text-amber-700' :
                                        'text-slate-700'
                            }`}>
                            {userPosition ? `#${userPosition}` : 'Not Found'}
                        </span>
                    </div>
                </div>

                {/* Risk & Difficulty */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2.5 bg-slate-50 rounded-lg text-center">
                        <p className="text-xs text-slate-400 mb-1">Zero-Click Risk</p>
                        <Badge variant={
                            zeroClickRisk === 'high' ? 'destructive' :
                                zeroClickRisk === 'medium' ? 'secondary' :
                                    'default'
                        } className="text-xs">
                            {zeroClickRisk === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {zeroClickRisk.toUpperCase()}
                        </Badge>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg text-center">
                        <p className="text-xs text-slate-400 mb-1">Difficulty</p>
                        <Badge variant="secondary" className="text-xs capitalize">{difficulty}</Badge>
                    </div>
                </div>

                {/* SERP Features */}
                <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2">SERP Features</p>
                    <div className="flex flex-wrap gap-1.5">
                        {serpFeatures.filter((f) => f.present).map((f) => (
                            <span
                                key={f.type}
                                className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100"
                            >
                                {f.type.replace(/_/g, ' ')}
                            </span>
                        ))}
                        {serpFeatures.filter((f) => f.present).length === 0 && (
                            <span className="text-xs text-slate-400">None detected</span>
                        )}
                    </div>
                </div>

                {/* Top 5 Competitors */}
                <div>
                    <p className="text-xs text-slate-400 mb-2">Top Results</p>
                    <div className="space-y-1.5">
                        {topResults.slice(0, 5).map((r) => (
                            <div
                                key={r.position}
                                className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-md ${r.domain === new URL(
                                    keywordAnalysis.keyword ? `https://${r.domain}` : r.url
                                ).hostname
                                        ? 'bg-blue-50 border border-blue-100'
                                        : 'hover:bg-slate-50'
                                    }`}
                            >
                                <span className="font-mono text-slate-400 w-4">#{r.position}</span>
                                <span className="text-slate-700 truncate">{r.domain}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
