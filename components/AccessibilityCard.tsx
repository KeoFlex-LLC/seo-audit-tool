'use client';

import {
    Accessibility,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Languages,
    Smartphone,
    Image as ImageIcon,
    FormInput,
} from 'lucide-react';
import type { AccessibilityInfo } from '@/lib/types';

interface AccessibilityCardProps {
    accessibility: AccessibilityInfo;
}

export default function AccessibilityCard({ accessibility }: AccessibilityCardProps) {
    const checks = [
        {
            label: 'Viewport Meta Tag',
            icon: Smartphone,
            pass: accessibility.hasViewport,
            detail: accessibility.hasViewport
                ? `Set: ${accessibility.viewportContent.slice(0, 60)}`
                : 'Missing — page may not render properly on mobile devices',
        },
        {
            label: 'Language Attribute',
            icon: Languages,
            pass: accessibility.hasLangAttribute,
            detail: accessibility.hasLangAttribute
                ? `Language: ${accessibility.langValue}`
                : 'Missing — screen readers cannot determine page language',
        },
        {
            label: 'Image Alt Text',
            icon: ImageIcon,
            pass: accessibility.imagesWithoutAlt === 0,
            detail: accessibility.totalImages === 0
                ? 'No images found'
                : accessibility.imagesWithoutAlt === 0
                    ? `All ${accessibility.totalImages} images have alt text`
                    : `${accessibility.imagesWithoutAlt} of ${accessibility.totalImages} images missing alt text`,
        },
        {
            label: 'Form Labels',
            icon: FormInput,
            pass: accessibility.formInputsWithoutLabel === 0,
            detail: accessibility.formInputsWithoutLabel === 0
                ? 'All form inputs have labels'
                : `${accessibility.formInputsWithoutLabel} input(s) without associated labels`,
        },
    ];

    const passCount = checks.filter(c => c.pass).length;
    const scoreColor =
        passCount === 4 ? 'text-emerald-600' :
            passCount >= 2 ? 'text-amber-600' :
                'text-red-600';

    const scoreBg =
        passCount === 4 ? 'bg-emerald-50 border-emerald-200' :
            passCount >= 2 ? 'bg-amber-50 border-amber-200' :
                'bg-red-50 border-red-200';

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Accessibility className="w-4 h-4 text-blue-600" />
                    Accessibility
                </h3>
                <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${scoreBg} ${scoreColor}`}>
                    {passCount}/4
                </div>
            </div>

            <div className="space-y-2">
                {checks.map((check) => {
                    const Icon = check.icon;
                    return (
                        <div
                            key={check.label}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${check.pass ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'
                                }`}
                        >
                            <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                <Icon className={`w-4 h-4 ${check.pass ? 'text-emerald-600' : 'text-amber-600'}`} />
                                {check.pass ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className={`text-sm font-medium ${check.pass ? 'text-emerald-800' : 'text-amber-800'}`}>
                                    {check.label}
                                </p>
                                <p className={`text-xs mt-0.5 ${check.pass ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {check.detail}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
