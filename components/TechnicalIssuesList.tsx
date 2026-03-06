'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { HealthIssue } from '@/lib/types';

interface TechnicalIssuesListProps {
    issues: HealthIssue[];
}

export default function TechnicalIssuesList({ issues }: TechnicalIssuesListProps) {
    const criticals = issues.filter((i) => i.severity === 'critical');
    const warnings = issues.filter((i) => i.severity === 'warning');
    const notices = issues.filter((i) => i.severity === 'notice');

    const getSeverityConfig = (severity: string) => {
        switch (severity) {
            case 'critical':
                return {
                    icon: AlertCircle,
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    iconColor: 'text-red-500',
                    badgeBg: 'bg-red-100 text-red-700',
                };
            case 'warning':
                return {
                    icon: AlertTriangle,
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    iconColor: 'text-amber-500',
                    badgeBg: 'bg-amber-100 text-amber-700',
                };
            default:
                return {
                    icon: Info,
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    iconColor: 'text-blue-500',
                    badgeBg: 'bg-blue-100 text-blue-700',
                };
        }
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Technical Issues</span>
                    <div className="flex items-center gap-2">
                        {criticals.length > 0 && (
                            <Badge className="bg-red-100 text-red-700 text-xs hover:bg-red-100">
                                {criticals.length} Critical
                            </Badge>
                        )}
                        {warnings.length > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs hover:bg-amber-100">
                                {warnings.length} Warning
                            </Badge>
                        )}
                        {notices.length > 0 && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs hover:bg-blue-100">
                                {notices.length} Notice
                            </Badge>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
                {issues.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">✓</span>
                        </div>
                        <p className="text-sm text-slate-500">No issues detected — great job!</p>
                    </div>
                ) : (
                    issues.map((issue, i) => {
                        const config = getSeverityConfig(issue.severity);
                        const Icon = config.icon;
                        return (
                            <div
                                key={i}
                                className={`rounded-lg border p-4 ${config.bg} ${config.border}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${config.badgeBg}`}>
                                                {issue.category}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 mb-1">{issue.message}</p>
                                        <p className="text-xs text-slate-500">{issue.recommendation}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
