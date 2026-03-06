'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IndexabilityInfo } from '@/lib/types';

interface IndexabilityCardProps {
    indexability: IndexabilityInfo;
}

export default function IndexabilityCard({ indexability }: IndexabilityCardProps) {
    const checks = [
        {
            label: 'Indexable by Google',
            status: indexability.isIndexable,
            critical: true,
            detail: indexability.hasNoindex ? 'BLOCKED: noindex directive found' : 'Page can be indexed',
        },
        {
            label: 'Canonical URL',
            status: indexability.canonicalStatus === 'match',
            critical: indexability.canonicalStatus === 'mismatch',
            detail: indexability.canonicalStatus === 'match'
                ? 'Canonical matches page URL'
                : indexability.canonicalStatus === 'mismatch'
                    ? `Mismatch: ${indexability.canonicalUrl}`
                    : 'No canonical tag set',
        },
        {
            label: 'Link Equity Flow',
            status: !indexability.hasNofollow,
            critical: false,
            detail: indexability.hasNofollow ? 'nofollow blocks PageRank flow' : 'Links pass equity normally',
        },
        {
            label: 'No Redirect Chain',
            status: !indexability.hasRedirectChain,
            critical: false,
            detail: indexability.hasRedirectChain ? 'Redirect detected — wastes crawl budget' : 'Direct access, no redirects',
        },
        {
            label: 'Robots Directive',
            status: !indexability.hasNoindex && !indexability.hasNofollow,
            critical: false,
            detail: indexability.robotsDirective || 'index,follow (default)',
        },
    ];

    const passedCount = checks.filter(c => c.status).length;
    const allPassed = passedCount === checks.length;
    const hasCritical = checks.some(c => c.critical && !c.status);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                    <span>🔍 Indexability</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${hasCritical ? 'bg-red-100 text-red-700' :
                            allPassed ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                        }`}>
                        {hasCritical ? '⛔ BLOCKED' : allPassed ? '✅ INDEXABLE' : `${passedCount}/${checks.length}`}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {checks.map((check, i) => (
                        <div key={i} className={`flex items-start gap-2 p-2 rounded text-sm ${!check.status && check.critical ? 'bg-red-50' :
                                !check.status ? 'bg-yellow-50' :
                                    'bg-green-50'
                            }`}>
                            <span className="text-lg mt-[-2px]">
                                {check.status ? '✅' : check.critical ? '🚫' : '⚠️'}
                            </span>
                            <div>
                                <div className="font-medium">{check.label}</div>
                                <div className="text-xs text-muted-foreground">{check.detail}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {indexability.xRobotsTag && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <span className="font-medium">X-Robots-Tag:</span> {indexability.xRobotsTag}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
