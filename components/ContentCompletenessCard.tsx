'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContentComprehensiveness, RichResultEligibility } from '@/lib/types';

interface ContentCompletenessCardProps {
    comprehensiveness: ContentComprehensiveness;
    richResults: RichResultEligibility;
}

export default function ContentCompletenessCard({ comprehensiveness, richResults }: ContentCompletenessCardProps) {
    const cc = comprehensiveness;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">📊 Content Depth & Rich Results</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-xl font-bold">{cc.contentSections}</div>
                        <div className="text-xs text-muted-foreground">Sections</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-xl font-bold">{cc.entityCount}</div>
                        <div className="text-xs text-muted-foreground">Entities</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-xl font-bold">{cc.estimatedReadTimeMin}m</div>
                        <div className="text-xs text-muted-foreground">Read Time</div>
                    </div>
                </div>

                {/* Content Signals */}
                <div className="space-y-2 mb-4">
                    <div className={`flex items-center gap-2 p-1.5 rounded text-sm ${cc.hasFAQ ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        <span>{cc.hasFAQ ? '✅' : '⚠️'}</span>
                        <span>FAQ Section</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                            {cc.hasFAQ ? 'Found — eligible for PAA' : 'Missing — add for "People Also Ask"'}
                        </span>
                    </div>
                    <div className={`flex items-center gap-2 p-1.5 rounded text-sm ${cc.hasTableOfContents ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <span>{cc.hasTableOfContents ? '✅' : '💡'}</span>
                        <span>Table of Contents</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                            {cc.hasTableOfContents ? 'Present' : 'Recommended for long content'}
                        </span>
                    </div>
                </div>

                {/* Topics Covered */}
                {cc.topicCoverage.length > 0 && (
                    <div className="mb-4">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                            Topics Covered ({cc.topicCoverage.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {cc.topicCoverage.slice(0, 12).map((topic, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded">
                                    {topic.length > 30 ? topic.slice(0, 30) + '…' : topic}
                                </span>
                            ))}
                            {cc.topicCoverage.length > 12 && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                                    +{cc.topicCoverage.length - 12} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Rich Results Eligibility */}
                <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Google Rich Results</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${richResults.potentialCTRBoost === 'high' ? 'bg-green-100 text-green-700' :
                                richResults.potentialCTRBoost === 'medium' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                            }`}>
                            CTR Boost: {richResults.potentialCTRBoost.toUpperCase()}
                        </span>
                    </div>

                    {richResults.eligible.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs text-green-600 font-medium mb-1">✅ Eligible Rich Results</div>
                            <div className="flex flex-wrap gap-1.5">
                                {richResults.eligible.map((r, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded">
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {richResults.missing.length > 0 && (
                        <div>
                            <div className="text-xs text-orange-600 font-medium mb-1">⚡ Missing Opportunities</div>
                            <div className="space-y-1">
                                {richResults.missing.slice(0, 4).map((m, i) => (
                                    <div key={i} className="text-xs text-muted-foreground pl-3">• {m}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
