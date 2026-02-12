'use client';

import {
    Share2,
    CheckCircle2,
    XCircle,
    Twitter,
    Globe,
} from 'lucide-react';
import type { SocialMeta, MetaInfo } from '@/lib/types';

interface SocialPreviewCardProps {
    social: SocialMeta;
    meta: MetaInfo;
    url: string;
}

export default function SocialPreviewCard({ social, meta, url }: SocialPreviewCardProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                Social Media Readiness
            </h3>

            {/* Status Badges */}
            <div className="flex gap-3 mb-5">
                <StatusBadge
                    icon={Globe}
                    label="Open Graph"
                    complete={social.ogComplete}
                />
                <StatusBadge
                    icon={Twitter}
                    label="Twitter Card"
                    complete={social.twitterComplete}
                />
            </div>

            {/* OG Preview */}
            <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Social Share Preview</p>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    {meta.ogImage ? (
                        <div className="h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-400 border-b border-slate-200">
                            <img
                                src={meta.ogImage}
                                alt="OG Image"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    ) : (
                        <div className="h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-400 border-b border-slate-200">
                            No og:image set
                        </div>
                    )}
                    <div className="p-3">
                        <p className="text-xs text-slate-400 uppercase truncate">
                            {url.replace(/^https?:\/\//, '').split('/')[0]}
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                            {meta.ogTitle || meta.title || '(No og:title)'}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {meta.ogDescription || meta.description || '(No og:description)'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Detail checklist */}
            <div className="space-y-1.5 text-sm">
                <CheckRow label="og:title" value={meta.ogTitle} />
                <CheckRow label="og:description" value={meta.ogDescription} />
                <CheckRow label="og:image" value={meta.ogImage} />
                <CheckRow label="og:type" value={social.ogType} />
                <CheckRow label="twitter:card" value={social.twitterCard} />
                <CheckRow label="twitter:title" value={social.twitterTitle} />
                <CheckRow label="twitter:image" value={social.twitterImage} />
            </div>
        </div>
    );
}

function StatusBadge({ icon: Icon, label, complete }: { icon: typeof Globe; label: string; complete: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${complete
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {complete ? (
                <CheckCircle2 className="w-3 h-3" />
            ) : (
                <XCircle className="w-3 h-3" />
            )}
        </span>
    );
}

function CheckRow({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex items-center justify-between py-1.5 px-2 rounded">
            <span className="text-slate-500 font-mono text-xs">{label}</span>
            {value ? (
                <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-xs max-w-[120px] truncate">{value}</span>
                </span>
            ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400" />
            )}
        </div>
    );
}
