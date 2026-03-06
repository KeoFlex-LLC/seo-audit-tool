'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CheckCircle2, Circle, ArrowUpRight, Zap, Clock } from 'lucide-react';
import { useState } from 'react';
import type { AIRecommendation } from '@/lib/types';

interface AIInsightsCardProps {
    recommendations: AIRecommendation[];
}

export default function AIInsightsCard({ recommendations }: AIInsightsCardProps) {
    const [completed, setCompleted] = useState<Set<number>>(new Set());

    const toggleComplete = (priority: number) => {
        setCompleted((prev) => {
            const next = new Set(prev);
            if (next.has(priority)) {
                next.delete(priority);
            } else {
                next.add(priority);
            }
            return next;
        });
    };

    if (recommendations.length === 0) {
        return (
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No recommendations available.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'high': return 'bg-green-100 text-green-700';
            case 'medium': return 'bg-blue-100 text-blue-700';
            case 'low': return 'bg-slate-100 text-slate-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getEffortIcon = (effort: string) => {
        switch (effort) {
            case 'low': return <Zap className="w-3.5 h-3.5" />;
            case 'medium': return <Clock className="w-3.5 h-3.5" />;
            case 'high': return <ArrowUpRight className="w-3.5 h-3.5" />;
            default: return null;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'content': return 'bg-purple-100 text-purple-700';
            case 'technical': return 'bg-cyan-100 text-cyan-700';
            case 'performance': return 'bg-amber-100 text-amber-700';
            case 'strategy': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 mb-1">Strategic Action Plan</h3>
                            <p className="text-sm text-slate-600">
                                {recommendations.length} prioritized recommendations based on your audit data.
                                Organized by impact and effort to maximize your SEO ROI.
                            </p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                                <span>{completed.size} of {recommendations.length} completed</span>
                                <div className="flex-1 max-w-32 h-1.5 bg-white rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all"
                                        style={{ width: `${(completed.size / recommendations.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations List */}
            <div className="space-y-4">
                {recommendations.map((rec) => {
                    const isComplete = completed.has(rec.priority);
                    return (
                        <Card
                            key={rec.priority}
                            className={`border-slate-200 shadow-sm transition-all duration-200 ${isComplete ? 'opacity-60 bg-slate-50' : 'hover:shadow-md'
                                }`}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleComplete(rec.priority)}
                                        className="flex-shrink-0 mt-0.5 transition hover:scale-110"
                                    >
                                        {isComplete ? (
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-slate-300 hover:text-blue-400" />
                                        )}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        {/* Title Row */}
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                #{rec.priority}
                                            </span>
                                            <h4 className={`font-semibold text-slate-900 ${isComplete ? 'line-through' : ''}`}>
                                                {rec.title}
                                            </h4>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                                            {rec.description}
                                        </p>

                                        {/* Badges */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className={`text-xs ${getCategoryColor(rec.category)}`}>
                                                {rec.category}
                                            </Badge>
                                            <Badge className={`text-xs ${getImpactColor(rec.impact)}`}>
                                                Impact: {rec.impact}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs gap-1">
                                                {getEffortIcon(rec.effort)}
                                                Effort: {rec.effort}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
