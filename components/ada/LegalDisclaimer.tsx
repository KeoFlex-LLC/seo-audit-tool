'use client';

import { AlertTriangle } from 'lucide-react';

interface LegalDisclaimerProps {
    text: string;
}

export default function LegalDisclaimer({ text }: LegalDisclaimerProps) {
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">Important Legal Notice</p>
                <p className="text-xs text-amber-700 leading-relaxed">{text}</p>
            </div>
        </div>
    );
}
