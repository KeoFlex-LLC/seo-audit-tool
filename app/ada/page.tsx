'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Globe,
    ArrowRight,
    ArrowLeft,
    Shield,
    Eye,
    Hand,
    Brain,
    Cog,
    AlertTriangle,
    Accessibility,
    Zap,
    CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ADAReport, WCAGLevel } from '@/lib/ada/types';
import ADADashboard from '@/components/ada/ADADashboard';

export default function ADAPage() {
    const [url, setUrl] = useState('');
    const [level, setLevel] = useState<WCAGLevel>('AA');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [report, setReport] = useState<ADAReport | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!url.trim()) {
            setError('Please enter a URL to scan.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/ada', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim(), level }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'ADA scan failed');
            }

            const { report: adaResult } = await res.json();
            setReport(adaResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    // After a report is loaded, show the dashboard
    if (report) {
        return (
            <div className="min-h-screen bg-slate-50">
                {/* Top Bar */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setReport(null)}
                                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                New Scan
                            </button>
                            <div className="h-5 w-px bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <Accessibility className="w-4 h-4 text-indigo-600" />
                                <span className="font-semibold text-slate-900 text-sm truncate max-w-xs">
                                    {report.url}
                                </span>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                            <span>WCAG 2.1 Level {report.targetLevel}</span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                    <ADADashboard report={report} />
                </main>
            </div>
        );
    }

    // Scan entry form
    return (
        <div className="min-h-screen flex flex-col">
            <section className="relative overflow-hidden flex-1 flex items-center justify-center px-4 py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
                {/* Decoratives */}
                <div className="absolute inset-0 dot-pattern opacity-30" />
                <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl animate-pulse delay-1000" />

                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    {/* Back to SEO */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-white transition mb-6"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to SEO Audit
                    </Link>

                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-8">
                        <Accessibility className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-200 font-medium tracking-wide">ADA Compliance Scanner</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        WCAG 2.1
                        <span className="block bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent">
                            Compliance Audit
                        </span>
                    </h1>

                    <p className="text-lg text-slate-300 mb-12 max-w-xl mx-auto leading-relaxed">
                        Full accessibility audit powered by axe-core engine. Scans the rendered DOM
                        via headless browser — catches JavaScript-injected content, ARIA attributes,
                        and computed CSS contrast.
                    </p>

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
                            <div className="text-left">
                                <Label htmlFor="ada-url" className="text-sm font-medium text-slate-300 mb-1.5 block">
                                    Website URL
                                </Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="ada-url"
                                        type="text"
                                        placeholder="example.com"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-slate-500 h-12 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="text-left">
                                <Label className="text-sm font-medium text-slate-300 mb-2 block">
                                    WCAG Conformance Level
                                </Label>
                                <div className="flex gap-2">
                                    {(['A', 'AA', 'AAA'] as WCAGLevel[]).map(l => (
                                        <button
                                            key={l}
                                            type="button"
                                            onClick={() => setLevel(l)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${level === l
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'bg-white/10 text-slate-400 hover:bg-white/15 hover:text-white'
                                                }`}
                                        >
                                            Level {l}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-1.5">
                                    {level === 'A' && 'Level A — minimum baseline (25 criteria)'}
                                    {level === 'AA' && 'Level AA — standard ADA/legal requirement (38 criteria)'}
                                    {level === 'AAA' && 'Level AAA — highest level, aspirational (61 criteria)'}
                                </p>
                            </div>

                            {error && (
                                <p className="text-sm text-red-400 text-left">{error}</p>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-wait"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Scanning with Headless Browser...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Run ADA Compliance Scan
                                        <ArrowRight className="w-5 h-5" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>

                    <p className="text-xs text-slate-500 mt-4">
                        Scans desktop (1280px) and mobile (375px) viewports · Takes 15–30 seconds
                    </p>
                </div>
            </section>

            {/* Features */}
            <section className="bg-slate-50 border-t border-slate-200 py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-center text-slate-900 mb-12">
                        What the ADA Scanner Checks
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: Eye,
                                title: 'Perceivable',
                                desc: 'Alt text, color contrast, text spacing, content reflow, captions.',
                                color: 'from-violet-500 to-purple-600',
                            },
                            {
                                icon: Hand,
                                title: 'Operable',
                                desc: 'Keyboard navigation, focus indicators, timing, motion controls.',
                                color: 'from-blue-500 to-cyan-600',
                            },
                            {
                                icon: Brain,
                                title: 'Understandable',
                                desc: 'Language tags, form labels, error identification, consistent UX.',
                                color: 'from-emerald-500 to-green-600',
                            },
                            {
                                icon: Cog,
                                title: 'Robust',
                                desc: 'Valid HTML, ARIA roles, status messages, parsing errors.',
                                color: 'from-amber-500 to-orange-600',
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
                            >
                                <div
                                    className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-200`}
                                >
                                    <feature.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Additional feature callouts */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                        {[
                            { icon: Zap, label: 'SEO Synergy Detection', desc: 'Flags issues that impact both accessibility AND search rankings.' },
                            { icon: CheckCircle, label: 'Warnings & Manual Review', desc: 'Items that need human verification beyond automated checks.' },
                            { icon: AlertTriangle, label: 'Legal Disclaimer', desc: 'Automated scans catch ~30-40% of issues. Manual testing required.' },
                        ].map(item => (
                            <div key={item.label} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                <item.icon className="w-5 h-5 text-indigo-600 mb-2" />
                                <h4 className="text-sm font-semibold text-indigo-800">{item.label}</h4>
                                <p className="text-xs text-indigo-600 mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="bg-slate-900 text-slate-400 py-6 px-4 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} KeoFlex — Performance Driven</p>
            </footer>
        </div>
    );
}
