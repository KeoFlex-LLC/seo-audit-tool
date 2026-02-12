'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import type { HealthScore } from '@/lib/types';

interface HealthScoreGaugeProps {
    healthScore: HealthScore;
}

export default function HealthScoreGauge({ healthScore }: HealthScoreGaugeProps) {
    const { overall, grade } = healthScore;

    const getColor = (score: number) => {
        if (score >= 80) return { ring: '#22c55e', bg: 'bg-green-50', text: 'text-green-600', label: 'Excellent' };
        if (score >= 65) return { ring: '#eab308', bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'Needs Work' };
        if (score >= 50) return { ring: '#f97316', bg: 'bg-orange-50', text: 'text-orange-600', label: 'Poor' };
        return { ring: '#ef4444', bg: 'bg-red-50', text: 'text-red-600', label: 'Critical' };
    };

    const colors = getColor(overall);
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (overall / 100) * circumference;

    return (
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Health Score
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-6">
                {/* Circular Gauge */}
                <div className="relative w-36 h-36 mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        {/* Background ring */}
                        <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="8"
                        />
                        {/* Score ring */}
                        <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke={colors.ring}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-slate-900">{overall}</span>
                        <span className="text-xs text-slate-400 font-medium">/ 100</span>
                    </div>
                </div>

                {/* Grade Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${colors.bg}`}>
                    <span className={`text-sm font-bold ${colors.text}`}>Grade: {grade}</span>
                    <span className={`text-xs ${colors.text} opacity-70`}>• {colors.label}</span>
                </div>

                {/* Category Breakdown */}
                <div className="w-full mt-5 space-y-2">
                    {healthScore.categories.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-28 truncate">{cat.name}</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${cat.score}%`,
                                        backgroundColor: getColor(cat.score).ring,
                                    }}
                                />
                            </div>
                            <span className="text-xs font-mono text-slate-400 w-6 text-right">
                                {Math.round(cat.weightedScore)}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
