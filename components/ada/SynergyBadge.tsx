'use client';

import { Zap } from 'lucide-react';

interface SynergyBadgeProps {
    note?: string;
}

export default function SynergyBadge({ note }: SynergyBadgeProps) {
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 border border-indigo-200 shrink-0 cursor-help"
            title={note || 'Fixing this issue improves both accessibility and SEO'}
        >
            <Zap className="w-3 h-3" />
            SEO Synergy
        </span>
    );
}
