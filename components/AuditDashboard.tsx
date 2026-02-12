'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Shield,
    Swords,
    Lightbulb,
    Globe,
    ExternalLink,
    Wrench,
    Search,
    BarChart3,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AuditJob } from '@/lib/types';
import HealthScoreGauge from '@/components/HealthScoreGauge';
import CoreVitalsCard from '@/components/CoreVitalsCard';
import TechnicalIssuesList from '@/components/TechnicalIssuesList';
import CompetitorMatrix from '@/components/CompetitorMatrix';
import AIInsightsCard from '@/components/AIInsightsCard';
import KeywordRankingCard from '@/components/KeywordRankingCard';
import SchemaCard from '@/components/SchemaCard';
import SecurityHeadersCard from '@/components/SecurityHeadersCard';
import AccessibilityCard from '@/components/AccessibilityCard';
import ContentQualityCard from '@/components/ContentQualityCard';
import SocialPreviewCard from '@/components/SocialPreviewCard';
import IndexabilityCard from '@/components/IndexabilityCard';
import EEATCard from '@/components/EEATCard';
import ContentCompletenessCard from '@/components/ContentCompletenessCard';
import RankingRoadmapCard from '@/components/RankingRoadmapCard';

interface AuditDashboardProps {
    job: AuditJob;
}

export default function AuditDashboard({ job }: AuditDashboardProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const report = job.report!;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            New Audit
                        </Link>
                        <div className="h-5 w-px bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-slate-900 text-sm truncate max-w-xs">
                                {report.url}
                            </span>
                            <a
                                href={report.url.startsWith('http') ? report.url : `https://${report.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-blue-600 transition"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                        <span>Keyword: <strong className="text-slate-600">{report.keyword}</strong></span>
                        <span>•</span>
                        <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            </header>

            {/* Dashboard Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-white border border-slate-200 p-1 rounded-xl mb-8 shadow-sm">
                        <TabsTrigger
                            value="overview"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium gap-2"
                        >
                            <Shield className="w-4 h-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="technical"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium gap-2"
                        >
                            <Wrench className="w-4 h-4" />
                            Technical
                        </TabsTrigger>
                        <TabsTrigger
                            value="competitors"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium gap-2"
                        >
                            <Swords className="w-4 h-4" />
                            Competitors
                        </TabsTrigger>
                        <TabsTrigger
                            value="strategy"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium gap-2"
                        >
                            <Lightbulb className="w-4 h-4" />
                            Strategy
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Top Row: Health Score + Vitals + Keyword */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <HealthScoreGauge healthScore={report.healthScore} />
                            <CoreVitalsCard vitals={report.vitals} />
                            <KeywordRankingCard keywordAnalysis={report.keywordAnalysis} />
                        </div>

                        {/* Page Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Word Count', value: report.pageAudit.wordCount.toLocaleString() },
                                { label: 'Internal Links', value: report.pageAudit.internalLinks.length.toString() },
                                { label: 'Images', value: report.pageAudit.images.length.toString() },
                                {
                                    label: 'Load Time',
                                    value: `${(report.pageAudit.loadTimeMs / 1000).toFixed(1)}s`,
                                },
                                {
                                    label: 'Keyword Density',
                                    value: report.pageAudit.contentQuality
                                        ? `${report.pageAudit.contentQuality.keywordDensity}%`
                                        : 'N/A',
                                },
                                {
                                    label: 'Readability',
                                    value: report.pageAudit.contentQuality
                                        ? `Grade ${report.pageAudit.contentQuality.readabilityGrade}`
                                        : 'N/A',
                                },
                                {
                                    label: 'Schema Types',
                                    value: report.pageAudit.schemaMarkup
                                        ? report.pageAudit.schemaMarkup.count.toString()
                                        : '0',
                                },
                                {
                                    label: 'Security Score',
                                    value: report.pageAudit.securityHeaders
                                        ? `${report.pageAudit.securityHeaders.score}/6`
                                        : 'N/A',
                                },
                                {
                                    label: 'Trust Score',
                                    value: report.pageAudit.eeat
                                        ? `${report.pageAudit.eeat.trustScore}/100`
                                        : 'N/A',
                                },
                                {
                                    label: 'Indexable',
                                    value: report.pageAudit.indexability
                                        ? (report.pageAudit.indexability.isIndexable ? '✅ Yes' : '⛔ No')
                                        : 'N/A',
                                },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition"
                                >
                                    <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Ranking Roadmap */}
                        <RankingRoadmapCard
                            issues={report.healthScore.issues}
                            currentScore={report.healthScore.overall}
                            keyword={report.keyword}
                        />

                        {/* Technical Issues */}
                        <TechnicalIssuesList issues={report.healthScore.issues} />

                        {/* SERP Preview */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Search className="w-4 h-4 text-blue-600" />
                                Google SERP Preview
                            </h3>
                            <div className="bg-white rounded-lg p-4 max-w-2xl border border-slate-100">
                                <p className="text-blue-700 text-xl font-normal hover:underline cursor-pointer leading-tight">
                                    {report.pageAudit.meta.title || '(No title tag)'}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <img
                                        src={`https://www.google.com/s2/favicons?domain=${report.pageAudit.finalUrl}&sz=16`}
                                        alt=""
                                        className="w-4 h-4 rounded-sm"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <p className="text-sm text-slate-700 truncate">
                                        {report.pageAudit.finalUrl}
                                    </p>
                                </div>
                                <p className="text-slate-600 text-sm mt-1.5 line-clamp-2 leading-relaxed">
                                    {report.pageAudit.meta.description || '(No meta description — Google will auto-generate one)'}
                                </p>
                            </div>
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-400">Title Length</span>
                                    <p className={`font-semibold ${report.pageAudit.meta.titleLength >= 30 && report.pageAudit.meta.titleLength <= 60
                                        ? 'text-green-600' : 'text-amber-600'
                                        }`}>
                                        {report.pageAudit.meta.titleLength} / 60
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Description</span>
                                    <p className={`font-semibold ${report.pageAudit.meta.descriptionLength >= 120 && report.pageAudit.meta.descriptionLength <= 160
                                        ? 'text-green-600' : 'text-amber-600'
                                        }`}>
                                        {report.pageAudit.meta.descriptionLength} / 160
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">HTTPS</span>
                                    <p className={`font-semibold ${report.pageAudit.isHttps ? 'text-green-600' : 'text-red-600'}`}>
                                        {report.pageAudit.isHttps ? 'Secure' : 'Not Secure'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400">Sitemap</span>
                                    <p className={`font-semibold ${report.pageAudit.hasSitemap ? 'text-green-600' : 'text-amber-600'}`}>
                                        {report.pageAudit.hasSitemap ? 'Found' : 'Not Found'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Technical Deep Dive Tab */}
                    <TabsContent value="technical" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Schema / Structured Data */}
                            {report.pageAudit.schemaMarkup && (
                                <SchemaCard schema={report.pageAudit.schemaMarkup} />
                            )}

                            {/* Security Headers */}
                            {report.pageAudit.securityHeaders && (
                                <SecurityHeadersCard headers={report.pageAudit.securityHeaders} />
                            )}

                            {/* Accessibility */}
                            {report.pageAudit.accessibility && (
                                <AccessibilityCard accessibility={report.pageAudit.accessibility} />
                            )}

                            {/* Content Quality */}
                            {report.pageAudit.contentQuality && (
                                <ContentQualityCard
                                    quality={report.pageAudit.contentQuality}
                                    wordCount={report.pageAudit.wordCount}
                                />
                            )}

                            {/* Social Media Readiness */}
                            {report.pageAudit.socialMeta && (
                                <SocialPreviewCard
                                    social={report.pageAudit.socialMeta}
                                    meta={report.pageAudit.meta}
                                    url={report.pageAudit.finalUrl}
                                />
                            )}

                            {/* Phase 3: Indexability */}
                            {report.pageAudit.indexability && (
                                <IndexabilityCard indexability={report.pageAudit.indexability} />
                            )}

                            {/* Phase 3: E-E-A-T Signals */}
                            {report.pageAudit.eeat && (
                                <EEATCard eeat={report.pageAudit.eeat} />
                            )}

                            {/* Phase 3: Content Depth & Rich Results */}
                            {report.pageAudit.contentComprehensiveness && report.pageAudit.richResults && (
                                <ContentCompletenessCard
                                    comprehensiveness={report.pageAudit.contentComprehensiveness}
                                    richResults={report.pageAudit.richResults}
                                />
                            )}

                            {/* Broken Links */}
                            {report.pageAudit.brokenLinks && report.pageAudit.brokenLinks.length > 0 && (
                                <div className="bg-white rounded-xl border border-slate-200 p-6">
                                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-red-500" />
                                        Broken Links ({report.pageAudit.brokenLinks.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {report.pageAudit.brokenLinks.map((link, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100 text-sm">
                                                <span className="text-red-800 truncate max-w-xs">{link.url}</span>
                                                <span className="text-red-600 font-mono text-xs shrink-0 ml-2">
                                                    {link.statusCode || 'Timeout'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hreflang Tags (if present) */}
                        {report.pageAudit.hreflangTags && report.pageAudit.hreflangTags.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="font-semibold text-slate-900 mb-3">
                                    International Targeting (Hreflang)
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {report.pageAudit.hreflangTags.map((tag) => (
                                        <span key={tag} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Competitors Tab */}
                    <TabsContent value="competitors">
                        <CompetitorMatrix
                            pageAudit={report.pageAudit}
                            vitals={report.vitals}
                            gapAnalyses={report.gapAnalyses}
                            competitors={report.competitors}
                        />
                    </TabsContent>

                    {/* Strategy Tab */}
                    <TabsContent value="strategy">
                        <AIInsightsCard recommendations={report.aiRecommendations} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
