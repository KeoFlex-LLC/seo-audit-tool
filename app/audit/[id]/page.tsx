'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AuditReport } from '@/lib/types';
import AuditDashboard from '@/components/AuditDashboard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuditResultsPage() {
    const params = useParams();
    const id = params.id as string;
    const [report, setReport] = useState<AuditReport | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        // Read the report from sessionStorage (stored by the homepage after audit)
        const stored = sessionStorage.getItem(`audit-${id}`);
        if (stored) {
            try {
                setReport(JSON.parse(stored));
            } catch {
                setError('Failed to load audit data. Please try again.');
            }
        } else {
            setError('Audit not found. It may have expired. Please run a new audit.');
        }
    }, [id]);

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-500 text-xl">!</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Audit Error</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Try Another URL
                    </Link>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="space-y-3 text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500">Loading audit...</p>
                </div>
            </div>
        );
    }

    // Show dashboard with results — wrap in the AuditJob-like shape the dashboard expects
    return (
        <AuditDashboard
            job={{
                id: report.id,
                url: report.url,
                keyword: report.keyword,
                status: 'completed' as const,
                steps: [],
                createdAt: report.createdAt,
                updatedAt: Date.now(),
                report,
            }}
        />
    );
}
