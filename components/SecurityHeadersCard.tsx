'use client';

import {
    Shield,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import type { SecurityHeaders } from '@/lib/types';

interface SecurityHeadersCardProps {
    headers: SecurityHeaders;
}

const HEADER_INFO: { key: keyof Omit<SecurityHeaders, 'score'>; label: string; description: string }[] = [
    { key: 'hasHSTS', label: 'Strict-Transport-Security', description: 'Enforces HTTPS connections' },
    { key: 'hasCSP', label: 'Content-Security-Policy', description: 'Prevents XSS and injection attacks' },
    { key: 'hasXFrameOptions', label: 'X-Frame-Options', description: 'Prevents clickjacking attacks' },
    { key: 'hasXContentType', label: 'X-Content-Type-Options', description: 'Prevents MIME-type sniffing' },
    { key: 'hasReferrerPolicy', label: 'Referrer-Policy', description: 'Controls referrer information' },
    { key: 'hasPermissionsPolicy', label: 'Permissions-Policy', description: 'Controls browser feature access' },
];

export default function SecurityHeadersCard({ headers }: SecurityHeadersCardProps) {
    const scoreColor =
        headers.score >= 5 ? 'text-emerald-600' :
            headers.score >= 3 ? 'text-amber-600' :
                'text-red-600';

    const scoreBg =
        headers.score >= 5 ? 'bg-emerald-50 border-emerald-200' :
            headers.score >= 3 ? 'bg-amber-50 border-amber-200' :
                'bg-red-50 border-red-200';

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Security Headers
                </h3>
                <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${scoreBg} ${scoreColor}`}>
                    {headers.score}/6
                </div>
            </div>

            <div className="space-y-2">
                {HEADER_INFO.map(({ key, label, description }) => {
                    const present = headers[key] as boolean;
                    return (
                        <div
                            key={key}
                            className={`flex items-center justify-between p-2.5 rounded-lg border ${present ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'
                                }`}
                        >
                            <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${present ? 'text-emerald-800' : 'text-red-800'}`}>
                                    {label}
                                </p>
                                <p className={`text-xs truncate ${present ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {description}
                                </p>
                            </div>
                            {present ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-500 shrink-0 ml-2" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
