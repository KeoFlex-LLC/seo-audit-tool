'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EEATSignals } from '@/lib/types';

interface EEATCardProps {
    eeat: EEATSignals;
}

export default function EEATCard({ eeat }: EEATCardProps) {
    const trustLevel = eeat.trustScore >= 80 ? 'Excellent'
        : eeat.trustScore >= 60 ? 'Good'
            : eeat.trustScore >= 40 ? 'Fair'
                : 'Needs Work';

    const trustColor = eeat.trustScore >= 80 ? 'text-green-600'
        : eeat.trustScore >= 60 ? 'text-blue-600'
            : eeat.trustScore >= 40 ? 'text-yellow-600'
                : 'text-red-600';

    const trustBg = eeat.trustScore >= 80 ? 'bg-green-100'
        : eeat.trustScore >= 60 ? 'bg-blue-100'
            : eeat.trustScore >= 40 ? 'bg-yellow-100'
                : 'bg-red-100';

    const checklist = [
        { label: 'Author Information', present: eeat.hasAuthorInfo, icon: '👤', weight: 'high' },
        { label: 'About Page', present: eeat.hasAboutPage, icon: '🏢', weight: 'high' },
        { label: 'Contact Page', present: eeat.hasContactPage, icon: '📧', weight: 'high' },
        { label: 'Privacy Policy', present: eeat.hasPrivacyPolicy, icon: '🔒', weight: 'medium' },
        { label: 'Terms of Service', present: eeat.hasTermsOfService, icon: '📜', weight: 'low' },
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                    <span>🏆 E-E-A-T Signals</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${trustBg} ${trustColor}`}>
                        {eeat.trustScore}/100 — {trustLevel}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Trust Score Bar */}
                <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all ${eeat.trustScore >= 80 ? 'bg-green-500' :
                                    eeat.trustScore >= 60 ? 'bg-blue-500' :
                                        eeat.trustScore >= 40 ? 'bg-yellow-500' :
                                            'bg-red-500'
                                }`}
                            style={{ width: `${eeat.trustScore}%` }}
                        />
                    </div>
                </div>

                {/* E-E-A-T Checklist */}
                <div className="space-y-2 mb-4">
                    {checklist.map((item, i) => (
                        <div key={i} className={`flex items-center gap-2 p-1.5 rounded text-sm ${item.present ? 'bg-green-50' : 'bg-red-50'
                            }`}>
                            <span>{item.icon}</span>
                            <span className="flex-1">{item.label}</span>
                            <span>{item.present ? '✅' : '❌'}</span>
                        </div>
                    ))}
                </div>

                {/* Additional Trust Signals */}
                {eeat.signals.length > 0 && (
                    <div className="border-t pt-3">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Additional Trust Signals</div>
                        <div className="flex flex-wrap gap-1.5">
                            {eeat.signals.map((signal, i) => (
                                <span key={i} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                                    {signal}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
