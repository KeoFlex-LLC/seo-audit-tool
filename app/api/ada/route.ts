// ============================================================================
// POST /api/ada — Run an ADA/WCAG 2.1 compliance scan
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type { WCAGLevel } from '@/lib/ada/types';
import { scanPage } from '@/lib/ada/scanner';
import { analyzeADA } from '@/lib/ada/analyzer';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, level } = body;

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 },
            );
        }

        let normalizedUrl: string;
        try {
            const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
            normalizedUrl = parsed.href;
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 },
            );
        }

        const targetLevel: WCAGLevel = (level === 'A' || level === 'AA' || level === 'AAA')
            ? level
            : 'AA';

        console.log(`[ADA API] Starting scan: ${normalizedUrl} at Level ${targetLevel}`);

        // scanPage manages its own browser lifecycle (launch + close)
        const pageResults = await scanPage({
            url: normalizedUrl,
            targetLevel,
            includeDesktop: true,
            includeMobile: true,
            includeWarnings: true,
            includeNotices: false,
            screenCapture: true,
            timeout: 30000,
        });

        const report = analyzeADA(normalizedUrl, pageResults, targetLevel);

        console.log(`[ADA API] Scan complete: score=${report.complianceScore}, grade=${report.grade}, violations=${report.totalViolations}, warnings=${report.totalWarnings}, checks=${report.totalChecksRun}`);

        if (report.scanErrors.length > 0) {
            console.warn(`[ADA API] Scan errors: ${report.scanErrors.join('; ')}`);
        }

        return NextResponse.json({ report }, { status: 200 });
    } catch (error) {
        console.error('[ADA API] Critical error:', error);

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'ADA scan failed' },
            { status: 500 },
        );
    }
}
