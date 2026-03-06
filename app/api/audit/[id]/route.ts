// ============================================================================
// GET /api/audit/[id] — Poll audit job status and results
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuditJob } from '@/lib/job-manager';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const job = getAuditJob(id);

    if (!job) {
        return NextResponse.json(
            { error: 'Audit job not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({
        id: job.id,
        url: job.url,
        keyword: job.keyword,
        status: job.status,
        steps: job.steps,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        report: job.report || null,
        error: job.error || null,
    });
}
