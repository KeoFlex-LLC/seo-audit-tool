'use client';

import type { WCAGLevel } from '@/lib/ada/types';

interface ComplianceGaugeProps {
    score: number;
    grade: string;
    targetLevel: WCAGLevel;
}

export default function ComplianceGauge({ score, grade, targetLevel }: ComplianceGaugeProps) {
    // SVG arc math
    const radius = 64;
    const stroke = 8;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Color based on score
    const getGaugeColor = (s: number) => {
        if (s >= 90) return { stroke: '#059669', bg: 'from-emerald-500 to-green-600', text: 'text-emerald-700' };
        if (s >= 80) return { stroke: '#0891b2', bg: 'from-cyan-500 to-blue-600', text: 'text-cyan-700' };
        if (s >= 70) return { stroke: '#d97706', bg: 'from-amber-500 to-yellow-600', text: 'text-amber-700' };
        if (s >= 50) return { stroke: '#ea580c', bg: 'from-orange-500 to-red-600', text: 'text-orange-700' };
        return { stroke: '#dc2626', bg: 'from-red-500 to-rose-600', text: 'text-red-700' };
    };

    const colors = getGaugeColor(score);

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 148 148">
                    {/* Background circle */}
                    <circle
                        cx="74"
                        cy="74"
                        r={radius}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth={stroke}
                    />
                    {/* Score arc */}
                    <circle
                        cx="74"
                        cy="74"
                        r={radius}
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${colors.text}`}>{score}</span>
                    <span className="text-xs text-slate-400 font-medium">/ 100</span>
                </div>
            </div>

            {/* Grade badge */}
            <div className="mt-2 flex items-center gap-2">
                <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${colors.bg} text-white font-bold text-sm shadow-sm`}
                >
                    {grade}
                </span>
                <span className="text-sm text-slate-600">
                    WCAG 2.1 Level {targetLevel}
                </span>
            </div>
        </div>
    );
}
