'use client';

import {
    Code,
    CheckCircle2,
    XCircle,
    Info,
} from 'lucide-react';
import type { SchemaMarkup } from '@/lib/types';

interface SchemaCardProps {
    schema: SchemaMarkup;
}

export default function SchemaCard({ schema }: SchemaCardProps) {
    const hasAnySchema = schema.hasJsonLd || schema.hasMicrodata;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                Structured Data
            </h3>

            {/* Format Badges */}
            <div className="flex gap-3 mb-4">
                <StatusBadge label="JSON-LD" active={schema.hasJsonLd} />
                <StatusBadge label="Microdata" active={schema.hasMicrodata} />
            </div>

            {hasAnySchema ? (
                <>
                    <p className="text-sm text-slate-500 mb-3">
                        {schema.count} schema type{schema.count !== 1 ? 's' : ''} detected
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {schema.types.map((type) => (
                            <span
                                key={type}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                {type}
                            </span>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">No structured data found</p>
                        <p className="text-xs text-amber-600 mt-1">
                            Add JSON-LD schema markup (Organization, WebPage, FAQ) to earn rich snippets in search results.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ label, active }: { label: string; active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
        >
            {active ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
                <XCircle className="w-3.5 h-3.5" />
            )}
            {label}
        </span>
    );
}
