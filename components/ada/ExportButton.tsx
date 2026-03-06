'use client';

import { useState } from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import type { ADAReport } from '@/lib/ada/types';

interface ExportButtonProps {
    report: ADAReport;
}

function generatePrintHTML(report: ADAReport): string {
    const date = new Date(report.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    const impactColor = (impact: string) => {
        switch (impact) {
            case 'critical': return '#dc2626';
            case 'serious': return '#ea580c';
            case 'moderate': return '#d97706';
            case 'minor': return '#2563eb';
            default: return '#64748b';
        }
    };

    const gradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return '#059669';
            case 'B': return '#0891b2';
            case 'C': return '#d97706';
            case 'D': return '#ea580c';
            case 'F': return '#dc2626';
            default: return '#64748b';
        }
    };

    const issueRows = report.siteIssues
        .sort((a, b) => {
            const order: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
            return (order[a.impact] ?? 3) - (order[b.impact] ?? 3);
        })
        .map(issue => `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">
                    <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;color:white;background:${impactColor(issue.impact)}">${issue.impact}</span>
                </td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">${issue.help}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;font-family:monospace;color:#6366f1;">${issue.code}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;">${issue.affectedPages}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;">${issue.totalNodes}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;">${issue.seoSynergy ? '✓' : ''}</td>
            </tr>
        `).join('');

    // Per-page summary
    const pageMap = new Map<string, { errors: number; passes: number; error?: string }>();
    for (const pr of report.pageResults) {
        const existing = pageMap.get(pr.url) || { errors: 0, passes: 0 };
        existing.errors += pr.violations.length;
        existing.passes += pr.passCount;
        if (pr.scanError) existing.error = pr.scanError;
        pageMap.set(pr.url, existing);
    }

    const pageRows = Array.from(pageMap.entries()).map(([url, data]) => {
        const total = data.errors + data.passes;
        const score = total > 0 ? Math.round((data.passes / total) * 100) : 0;
        return `
            <tr>
                <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;max-width:300px;overflow:hidden;text-overflow:ellipsis;">${url}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;font-weight:600;">${data.error ? 'Failed' : score + '%'}</td>
                <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;color:#dc2626;font-weight:600;">${data.errors}</td>
            </tr>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>ADA Compliance Report — ${report.url}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 40px; max-width: 900px; margin: 0 auto; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        h2 { font-size: 18px; margin-top: 32px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
        h3 { font-size: 14px; margin-top: 16px; margin-bottom: 8px; }
        .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
        .score-box { display: inline-flex; align-items: center; gap: 12px; padding: 16px 24px; border-radius: 12px; background: #f8fafc; border: 2px solid #e2e8f0; margin-bottom: 24px; }
        .score { font-size: 48px; font-weight: 800; }
        .grade { font-size: 24px; font-weight: 800; color: white; padding: 4px 12px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { text-align: left; padding: 8px 12px; background: #f1f5f9; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .stat-card { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
        .stat-value { font-size: 24px; font-weight: 700; }
        .stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }
        .disclaimer { font-size: 11px; color: #94a3b8; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <h1>♿ ADA / WCAG 2.1 Compliance Report</h1>
    <p class="subtitle">${report.url} · Level ${report.targetLevel} · ${date}</p>

    <div class="score-box">
        <span class="score" style="color:${gradeColor(report.grade)}">${report.complianceScore}</span>
        <div>
            <span class="grade" style="background:${gradeColor(report.grade)}">${report.grade}</span>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">/ 100</div>
        </div>
    </div>

    <div class="stats-grid">
        <div class="stat-card"><div class="stat-value" style="color:#dc2626">${report.totalViolations}</div><div class="stat-label">Errors</div></div>
        <div class="stat-card"><div class="stat-value" style="color:#d97706">${report.totalWarnings}</div><div class="stat-label">Warnings</div></div>
        <div class="stat-card"><div class="stat-value" style="color:#2563eb">${report.totalChecksRun}</div><div class="stat-label">Checks Run</div></div>
        <div class="stat-card"><div class="stat-value" style="color:#7c3aed">${pageMap.size}</div><div class="stat-label">Pages Scanned</div></div>
    </div>

    <h2>Pages Scanned</h2>
    <table>
        <thead><tr><th>URL</th><th style="text-align:center">Score</th><th style="text-align:center">Errors</th></tr></thead>
        <tbody>${pageRows}</tbody>
    </table>

    <h2>All Issues (${report.siteIssues.length})</h2>
    <table>
        <thead><tr><th>Severity</th><th>Issue</th><th>Code</th><th style="text-align:center">Pages</th><th style="text-align:center">Elements</th><th style="text-align:center">SEO</th></tr></thead>
        <tbody>${issueRows}</tbody>
    </table>

    <p class="disclaimer">${report.legalDisclaimer}</p>
    <p class="disclaimer">Generated by KeoFlex SEO Audit Tool · ${new Date().toISOString()}</p>
</body>
</html>`;
}

export default function ExportButton({ report }: ExportButtonProps) {
    const [exporting, setExporting] = useState(false);

    function handlePrint() {
        setExporting(true);
        const html = generatePrintHTML(report);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                setExporting(false);
            }, 500);
        } else {
            setExporting(false);
        }
    }

    function handleDownloadHTML() {
        const html = generatePrintHTML(report);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const domain = new URL(report.url).hostname.replace(/\./g, '_');
        a.download = `ada_report_${domain}_${new Date().toISOString().slice(0, 10)}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handlePrint}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
                <Printer className="w-4 h-4" />
                Print Report
            </button>
            <button
                onClick={handleDownloadHTML}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
                <Download className="w-4 h-4" />
                Download Report
            </button>
        </div>
    );
}
