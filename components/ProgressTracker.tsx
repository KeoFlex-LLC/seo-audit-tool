'use client';

import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';
import type { AuditJob } from '@/lib/types';

interface ProgressTrackerProps {
    job: AuditJob;
}

export default function ProgressTracker({ job }: ProgressTrackerProps) {
    const completedSteps = job.steps.filter((s) => s.status === 'completed').length;
    const totalSteps = job.steps.length;
    const progressPercent = Math.round((completedSteps / totalSteps) * 100);

    return (
        <div className="min-h-screen gradient-hero relative overflow-hidden flex items-center justify-center px-4">
            <div className="absolute inset-0 dot-pattern" />

            <div className="relative z-10 w-full max-w-lg">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Analyzing Your Site</h2>
                        <p className="text-slate-400 text-sm truncate max-w-xs mx-auto">{job.url}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-400">Progress</span>
                            <span className="text-blue-400 font-mono font-semibold">{progressPercent}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                        {job.steps.map((step, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${step.status === 'running'
                                        ? 'bg-blue-500/10 border border-blue-500/20'
                                        : step.status === 'completed'
                                            ? 'bg-green-500/5'
                                            : step.status === 'failed'
                                                ? 'bg-red-500/10'
                                                : 'opacity-40'
                                    }`}
                            >
                                {/* Status Icon */}
                                <div className="flex-shrink-0">
                                    {step.status === 'completed' && (
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                    {step.status === 'running' && (
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                        </div>
                                    )}
                                    {step.status === 'failed' && (
                                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                            <AlertCircle className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                    {step.status === 'pending' && (
                                        <Circle className="w-6 h-6 text-slate-500" />
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={`text-sm font-medium ${step.status === 'running'
                                            ? 'text-blue-300'
                                            : step.status === 'completed'
                                                ? 'text-green-300'
                                                : step.status === 'failed'
                                                    ? 'text-red-300'
                                                    : 'text-slate-500'
                                        }`}
                                >
                                    {step.label}
                                </span>

                                {/* Duration */}
                                {step.status === 'completed' && step.startedAt && step.completedAt && (
                                    <span className="text-xs text-slate-500 ml-auto font-mono">
                                        {((step.completedAt - step.startedAt) / 1000).toFixed(1)}s
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Tip */}
                    <p className="text-xs text-slate-500 text-center mt-6">
                        This typically takes 30-60 seconds depending on site complexity.
                    </p>
                </div>
            </div>
        </div>
    );
}
