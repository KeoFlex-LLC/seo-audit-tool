'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HealthIssue } from '@/lib/types';

interface RankingRoadmapCardProps {
    issues: HealthIssue[];
    currentScore: number;
    keyword: string;
}

interface RoadmapItem {
    title: string;
    description: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'high' | 'medium' | 'low';
    category: string;
}

export default function RankingRoadmapCard({ issues, currentScore, keyword }: RankingRoadmapCardProps) {
    // Generate 3-phase roadmap from issues
    const phases = buildRoadmap(issues, currentScore, keyword);

    const phaseStyles = [
        { label: 'NOW — Quick Wins', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: '🔥' },
        { label: '30 DAYS — Foundation', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: '🏗️' },
        { label: '90 DAYS — Authority', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: '🚀' },
    ];

    const projectedScores = [
        Math.min(100, currentScore + 10),
        Math.min(100, currentScore + 25),
        Math.min(100, currentScore + 40),
    ];

    return (
        <Card className="border-2 border-blue-200">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                    <span>🗺️ Ranking Roadmap</span>
                    <span className="text-xs text-muted-foreground">
                        &quot;{keyword}&quot; → Target: Position 1
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Score Projection Bar */}
                <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">Score Trajectory:</div>
                    <div className="flex-1 flex items-center gap-1">
                        <span className="text-xs font-bold text-red-600">{currentScore}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-xs font-bold text-orange-600">{projectedScores[0]}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-xs font-bold text-blue-600">{projectedScores[1]}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-xs font-bold text-green-600">{projectedScores[2]}</span>
                    </div>
                </div>

                {/* 3 Phases */}
                <div className="space-y-3">
                    {phases.map((phase, phaseIdx) => (
                        <div key={phaseIdx} className={`rounded-lg border ${phaseStyles[phaseIdx].border} ${phaseStyles[phaseIdx].bg} p-3`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span>{phaseStyles[phaseIdx].icon}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${phaseStyles[phaseIdx].badge}`}>
                                    {phaseStyles[phaseIdx].label}
                                </span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                    Target: {projectedScores[phaseIdx]}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {phase.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-start gap-2 text-sm">
                                        <span className="text-xs mt-0.5">
                                            {item.effort === 'low' ? '🟢' : item.effort === 'medium' ? '🟡' : '🔴'}
                                        </span>
                                        <div className="flex-1">
                                            <span className="font-medium">{item.title}</span>
                                            <span className="text-xs text-muted-foreground ml-1">({item.category})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

/** Generate a 3-phase ranking roadmap from health issues */
function buildRoadmap(issues: HealthIssue[], _score: number, _keyword: string): RoadmapItem[][] {
    const now: RoadmapItem[] = [];
    const thirtyDays: RoadmapItem[] = [];
    const ninetyDays: RoadmapItem[] = [];

    // Critical issues → NOW
    for (const issue of issues.filter(i => i.severity === 'critical')) {
        now.push({
            title: issue.recommendation.split('.')[0],
            description: issue.message,
            effort: 'low',
            impact: 'high',
            category: issue.category,
        });
    }

    // High-impact warnings → 30 days
    const highImpactCategories = ['Indexability', 'Title', 'Meta', 'Content', 'E-E-A-T', 'Schema'];
    for (const issue of issues.filter(i => i.severity === 'warning')) {
        const isHighImpact = highImpactCategories.some(c => issue.category.includes(c));
        const target = isHighImpact ? thirtyDays : ninetyDays;
        target.push({
            title: issue.recommendation.split('.')[0],
            description: issue.message,
            effort: 'medium',
            impact: isHighImpact ? 'high' : 'medium',
            category: issue.category,
        });
    }

    // Notices → 90 days
    for (const issue of issues.filter(i => i.severity === 'notice')) {
        ninetyDays.push({
            title: issue.recommendation.split('.')[0],
            description: issue.message,
            effort: 'high',
            impact: 'low',
            category: issue.category,
        });
    }

    // Ensure each phase has at least 1 item, max 5
    const addDefault = (arr: RoadmapItem[], msg: string, cat: string) => {
        if (arr.length === 0) {
            arr.push({ title: msg, description: '', effort: 'medium', impact: 'medium', category: cat });
        }
    };

    addDefault(now, 'Fix any critical indexability or content issues', 'General');
    addDefault(thirtyDays, 'Build out E-E-A-T signals and optimize on-page SEO', 'Strategy');
    addDefault(ninetyDays, 'Develop topical authority with comprehensive content', 'Content');

    return [now.slice(0, 5), thirtyDays.slice(0, 5), ninetyDays.slice(0, 5)];
}
