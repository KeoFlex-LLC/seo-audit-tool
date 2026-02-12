'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { AuditJob } from '@/lib/types';
import ProgressTracker from '@/components/ProgressTracker';
import AuditDashboard from '@/components/AuditDashboard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuditResultsPage() {
    const params = useParams();
    const id = params.id as string;
    const [job, setJob] = useState<AuditJob | null>(null);
    const [error, setError] = useState('');

    const fetchJob = useCallback(async () => {
        try {
            const res = await fetch(`/api/audit/${id}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setError('Audit not found. It may have expired.');
                    return;
                }
                throw new Error('Failed to fetch audit status');
            }
            const data = await res.json();
            setJob(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audit');
        }
    }, [id]);

    useEffect(() => {
        fetchJob();

        // Poll while not completed
        const interval = setInterval(() => {
            fetchJob().then(() => {
                // Check if we should stop polling
                if (job?.status === 'completed' || job?.status === 'failed') {
                    clearInterval(interval);
                }
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [fetchJob, job?.status]);

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

    if (!job) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="space-y-3 text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500">Loading audit...</p>
                </div>
            </div>
        );
    }

    // Show progress tracker while running
    if (job.status !== 'completed' && job.status !== 'failed') {
        return <ProgressTracker job={job} />;
    }

    // Show error state if failed
    if (job.status === 'failed') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-500 text-xl">!</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Audit Failed</h2>
                    <p className="text-slate-500 mb-2">{job.error || 'An unexpected error occurred.'}</p>
                    <p className="text-xs text-slate-400 mb-6">URL: {job.url}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Try Again
                    </Link>
                </div>
            </div>
        );
    }

    // Show dashboard with results
    return <AuditDashboard job={job} />;
}
