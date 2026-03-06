// ============================================================================
// POST /api/ada — Run an ADA/WCAG 2.1 compliance scan
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type { WCAGLevel } from '@/lib/ada/types';
import { scanPage, closeBrowser } from '@/lib/ada/scanner';
import { analyzeADA } from '@/lib/ada/analyzer';

// Headless browser rendering needs more time than static crawl
export const maxDuration = 120;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, level } = body;

        // Validate inputs
        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 },
            );
        }

        // Validate URL format
        try {
            new URL(url.startsWith('http') ? url : `https://${url}`);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 },
            );
        }

        // Validate and default target level
        const targetLevel: WCAGLevel = (level === 'A' || level === 'AA' || level === 'AAA')
            ? level
            : 'AA'; // Default to AA — the ADA legal standard

        console.log(`[ADA] Starting scan: ${url} at Level ${targetLevel}`);

        // Run the scan across both viewports
        const pageResults = await scanPage({
            url: url.trim(),
            targetLevel,
            includeDesktop: true,
            includeMobile: true,
            timeout: 30000, // 30s per page
        });

        // Build the full report
        const report = analyzeADA(url.trim(), pageResults, targetLevel);

        console.log(`[ADA] Scan complete: score=${report.complianceScore}, violations=${report.totalViolations}`);

        // Clean up the browser instance
        await closeBrowser();

        return NextResponse.json({ report }, { status: 200 });
    } catch (error) {
        console.error('[ADA] Scan error:', error);

        // Always try to close the browser on error
        try { await closeBrowser(); } catch { /* ignore */ }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'ADA scan failed' },
            { status: 500 },
        );
    }
}
