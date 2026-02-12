// ============================================================================
// POST /api/audit — Start a new audit job
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuditJob } from '@/lib/job-manager';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, keyword } = body;

        // Validate inputs
        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        if (!keyword || typeof keyword !== 'string') {
            return NextResponse.json(
                { error: 'Keyword is required' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(url.startsWith('http') ? url : `https://${url}`);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Create the job
        const jobId = createAuditJob(url, keyword.trim());

        return NextResponse.json({ jobId }, { status: 201 });
    } catch (error) {
        console.error('[API] Error creating audit job:', error);
        return NextResponse.json(
            { error: 'Failed to create audit job' },
            { status: 500 }
        );
    }
}
