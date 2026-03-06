'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Copy, Check, Download } from 'lucide-react';
import type { AuditReport } from '@/lib/types';
import { generateSEOPrompt } from '@/lib/prompt-generator';

interface PromptGeneratorCardProps {
    report: AuditReport;
}

export default function PromptGeneratorCard({ report }: PromptGeneratorCardProps) {
    const [copied, setCopied] = useState(false);
    const prompt = useMemo(() => generateSEOPrompt(report), [report]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = prompt;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleDownload = () => {
        const domain = new URL(
            report.url.startsWith('http') ? report.url : `https://${report.url}`
        ).hostname.replace('www.', '');
        const filename = `seo-instructions-${domain}-${new Date().toISOString().slice(0, 10)}.txt`;

        const blob = new Blob([prompt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Count sections for the info bar
    const sectionCount = (prompt.match(/^-{70}$/gm) || []).length / 2;

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-slate-50 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 mb-1">AI Coding Agent Prompt</h3>
                            <p className="text-sm text-slate-600">
                                A structured set of instructions generated from your audit data. Copy this
                                prompt and paste it into any AI coding assistant (ChatGPT, Claude, Gemini, Copilot, etc.)
                                to get production-ready code changes that will enhance your site&apos;s SEO.
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                <span>{Math.round(sectionCount)} sections</span>
                                <span>•</span>
                                <span>{prompt.length.toLocaleString()} characters</span>
                                <span>•</span>
                                <span>Based on {report.healthScore.issues.length} audit findings</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
                <Button
                    onClick={handleCopy}
                    className={`gap-2 transition-all duration-200 ${copied
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-violet-600 hover:bg-violet-700'
                        }`}
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Copy to Clipboard
                        </>
                    )}
                </Button>
                <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                    <Download className="w-4 h-4" />
                    Download .txt
                </Button>
            </div>

            {/* Prompt Display */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <pre className="p-6 text-sm text-slate-800 bg-slate-50 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[70vh] overflow-y-auto">
                        {prompt}
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}
