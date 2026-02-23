'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Zap, BarChart3, Shield, Brain, ArrowRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!url.trim() || !keyword.trim()) {
      setError('Please enter both a URL and a target keyword.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), keyword: keyword.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to run audit');
      }

      const { jobId, report } = await res.json();

      // Store the report in sessionStorage for the results page
      sessionStorage.setItem(`audit-${jobId}`, JSON.stringify(report));

      router.push(`/audit/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="gradient-hero relative overflow-hidden flex-1 flex items-center justify-center px-4 py-20">
        {/* Dot Pattern Overlay */}
        <div className="absolute inset-0 dot-pattern" />

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Brand */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-200 font-medium tracking-wide">SEO Audit v1.1</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Site&apos;s SEO
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Performance Report
            </span>
          </h1>

          <p className="text-lg text-slate-300 mb-12 max-w-xl mx-auto leading-relaxed">
            Comprehensive technical audit, keyword ranking intel, competitor benchmarking,
            and strategic recommendations — all from a single URL.
          </p>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="text-left">
                <Label htmlFor="url" className="text-sm font-medium text-slate-300 mb-1.5 block">
                  Website URL
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="url"
                    type="text"
                    placeholder="keoflex.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-slate-500 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="text-left">
                <Label htmlFor="keyword" className="text-sm font-medium text-slate-300 mb-1.5 block">
                  Target Keyword
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="keyword"
                    type="text"
                    placeholder="sports software"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-slate-500 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 text-left">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-base glow-pulse transition-all duration-200 disabled:opacity-60 disabled:cursor-wait"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Starting Audit...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Run Full Audit
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 border-t border-slate-200 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-12">
            What You Get
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Health Score',
                desc: 'Technical audit with weighted scoring across 8 categories.',
                color: 'from-green-500 to-emerald-600',
              },
              {
                icon: BarChart3,
                title: 'Keyword Intel',
                desc: 'SERP position tracking, zero-click risk, and difficulty analysis.',
                color: 'from-blue-500 to-cyan-600',
              },
              {
                icon: Zap,
                title: 'Competitor Gaps',
                desc: 'Side-by-side benchmarking against your top-ranking competitors.',
                color: 'from-amber-500 to-orange-600',
              },
              {
                icon: Brain,
                title: 'AI Strategy',
                desc: 'Data-driven recommendations prioritized by impact and effort.',
                color: 'from-purple-500 to-indigo-600',
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
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} KeoFlex — Performance Driven</p>
      </footer>
    </div>
  );
}
