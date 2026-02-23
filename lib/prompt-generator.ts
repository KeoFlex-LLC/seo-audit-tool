// ============================================================================
// KeoFlex SEO Audit Tool — AI Coding Agent Prompt Generator
// ============================================================================
// Generates a structured, plain-text prompt from audit data that can be
// pasted directly into an AI coding agent to enhance a site's SEO.

import type { AuditReport, HealthIssue } from './types';

/**
 * Generate a clear, structured prompt for an AI coding agent
 * based on the complete audit report.
 */
export function generateSEOPrompt(report: AuditReport): string {
    const lines: string[] = [];
    const { pageAudit, healthScore, vitals, keywordAnalysis, gapAnalyses, aiRecommendations } = report;

    // ── Header ──────────────────────────────────────────────────
    lines.push('='.repeat(70));
    lines.push('SEO ENHANCEMENT INSTRUCTIONS FOR AI CODING AGENT');
    lines.push('='.repeat(70));
    lines.push('');
    lines.push('You are an expert web developer. Use the audit findings below to make');
    lines.push('specific code changes that will improve this website\'s SEO performance.');
    lines.push('Implement each section in order of priority. Provide production-ready');
    lines.push('code — no placeholders.');
    lines.push('');

    // ── Context ─────────────────────────────────────────────────
    lines.push('-'.repeat(70));
    lines.push('SITE CONTEXT');
    lines.push('-'.repeat(70));
    lines.push(`  URL:              ${report.url}`);
    lines.push(`  Target Keyword:   ${report.keyword}`);
    lines.push(`  Health Score:     ${healthScore.overall}/100 (Grade: ${healthScore.grade})`);
    if (vitals) {
        lines.push(`  Performance:      ${vitals.performanceScore}/100`);
    }
    if (keywordAnalysis) {
        lines.push(`  Keyword Position: ${keywordAnalysis.userPosition ?? 'Not ranking in top 100'}`);
        lines.push(`  SERP Difficulty:  ${keywordAnalysis.difficulty}`);
    }
    lines.push('');

    // ── 1. Critical Fixes ───────────────────────────────────────
    const criticalIssues = healthScore.issues.filter((i: HealthIssue) => i.severity === 'critical');
    if (criticalIssues.length > 0) {
        lines.push('-'.repeat(70));
        lines.push('1. CRITICAL FIXES (Do these FIRST — they block ranking)');
        lines.push('-'.repeat(70));
        criticalIssues.forEach((issue: HealthIssue, idx: number) => {
            lines.push(`  ${idx + 1}. [${issue.category.toUpperCase()}] ${issue.message}`);
            lines.push(`     Action: ${issue.recommendation}`);
        });
        lines.push('');
    }

    // ── 2. Meta Tags & Title ────────────────────────────────────
    lines.push('-'.repeat(70));
    lines.push('2. META TAGS & TITLE OPTIMIZATION');
    lines.push('-'.repeat(70));
    lines.push(`  Current Title:        "${pageAudit.meta.title || '(MISSING)'}"`);
    lines.push(`  Title Length:          ${pageAudit.meta.titleLength} chars (target: 30-60)`);
    lines.push(`  Current Description:  "${pageAudit.meta.description || '(MISSING)'}"`);
    lines.push(`  Description Length:    ${pageAudit.meta.descriptionLength} chars (target: 120-160)`);
    if (pageAudit.contentQuality) {
        lines.push(`  Keyword in Title:     ${pageAudit.contentQuality.hasKeywordInTitle ? 'Yes' : 'NO — Add it'}`);
        lines.push(`  Keyword in H1:        ${pageAudit.contentQuality.hasKeywordInH1 ? 'Yes' : 'NO — Add it'}`);
        lines.push(`  Keyword in Meta Desc: ${pageAudit.contentQuality.hasKeywordInMeta ? 'Yes' : 'NO — Add it'}`);
    }
    lines.push('');
    lines.push('  Instructions:');
    if (!pageAudit.meta.title || pageAudit.meta.titleLength < 30 || pageAudit.meta.titleLength > 60) {
        lines.push(`  - Rewrite the <title> tag to be 30-60 characters, include "${report.keyword}" near the front.`);
    }
    if (!pageAudit.meta.description || pageAudit.meta.descriptionLength < 120 || pageAudit.meta.descriptionLength > 160) {
        lines.push(`  - Rewrite the meta description to be 120-160 characters, include "${report.keyword}", and add a call-to-action.`);
    }
    if (pageAudit.meta.ogTitle === undefined && pageAudit.socialMeta && !pageAudit.socialMeta.ogComplete) {
        lines.push('  - Add Open Graph tags: og:title, og:description, og:image, og:url, og:type.');
    }
    if (pageAudit.socialMeta && !pageAudit.socialMeta.twitterComplete) {
        lines.push('  - Add Twitter Card tags: twitter:card, twitter:title, twitter:description, twitter:image.');
    }
    lines.push('');

    // ── 3. Heading Structure ────────────────────────────────────
    lines.push('-'.repeat(70));
    lines.push('3. HEADING STRUCTURE');
    lines.push('-'.repeat(70));
    const h1 = pageAudit.headings.find(h => h.tag === 'h1');
    const h2s = pageAudit.headings.filter(h => h.tag === 'h2');
    lines.push(`  H1 Tag:     ${h1 ? `"${h1.text}"` : 'MISSING — Add one immediately'}`);
    lines.push(`  H2 Count:   ${h2s.length}`);
    lines.push('');
    lines.push('  Instructions:');
    if (!h1) {
        lines.push(`  - Add a single <h1> tag containing "${report.keyword}" that describes the page content.`);
    } else if (pageAudit.contentQuality && !pageAudit.contentQuality.hasKeywordInH1) {
        lines.push(`  - Update the H1 to naturally include "${report.keyword}".`);
    }
    if (h2s.length < 3) {
        lines.push('  - Add more H2 subheadings to break content into scannable sections.');
    }
    lines.push('');

    // ── 4. Schema / Structured Data ─────────────────────────────
    lines.push('-'.repeat(70));
    lines.push('4. SCHEMA MARKUP (STRUCTURED DATA)');
    lines.push('-'.repeat(70));
    if (pageAudit.schemaMarkup) {
        lines.push(`  JSON-LD Present:    ${pageAudit.schemaMarkup.hasJsonLd ? 'Yes' : 'No'}`);
        lines.push(`  Microdata Present:  ${pageAudit.schemaMarkup.hasMicrodata ? 'Yes' : 'No'}`);
        lines.push(`  Current Types:      ${pageAudit.schemaMarkup.types.length > 0 ? pageAudit.schemaMarkup.types.join(', ') : 'None'}`);
    }
    if (pageAudit.richResults) {
        lines.push(`  Missing for Rich Results: ${pageAudit.richResults.missing.length > 0 ? pageAudit.richResults.missing.join(', ') : 'None'}`);
        lines.push(`  CTR Boost Potential:      ${pageAudit.richResults.potentialCTRBoost}`);
    }
    lines.push('');
    lines.push('  Instructions:');
    if (!pageAudit.schemaMarkup?.hasJsonLd) {
        lines.push('  - Add a JSON-LD <script type="application/ld+json"> block in the <head>.');
    }
    lines.push('  - Include at minimum: Organization, WebPage, and BreadcrumbList schemas.');
    if (pageAudit.contentComprehensiveness?.hasFAQ || pageAudit.richResults?.missing.includes('FAQ')) {
        lines.push('  - Add FAQPage schema for any FAQ content to earn "People Also Ask" rich results.');
    }
    if (pageAudit.eeat?.sameAsLinks && pageAudit.eeat.sameAsLinks.length > 0) {
        lines.push(`  - Include sameAs links in Organization schema: ${pageAudit.eeat.sameAsLinks.join(', ')}`);
    }
    lines.push('');

    // ── 5. Content Optimization ─────────────────────────────────
    lines.push('-'.repeat(70));
    lines.push('5. CONTENT OPTIMIZATION');
    lines.push('-'.repeat(70));
    lines.push(`  Word Count:         ${pageAudit.wordCount}`);
    if (pageAudit.contentQuality) {
        lines.push(`  Keyword Count:      ${pageAudit.contentQuality.keywordCount} (density: ${pageAudit.contentQuality.keywordDensity}%)`);
        lines.push(`  Readability Grade:  ${pageAudit.contentQuality.readabilityGrade}`);
    }
    if (pageAudit.contentComprehensiveness) {
        const cc = pageAudit.contentComprehensiveness;
        lines.push(`  Content Sections:   ${cc.contentSections}`);
        lines.push(`  Has FAQ:            ${cc.hasFAQ ? 'Yes' : 'No'}`);
        lines.push(`  Has Table of Contents: ${cc.hasTableOfContents ? 'Yes' : 'No'}`);
        lines.push(`  Read Time:          ${cc.estimatedReadTimeMin} min (target: 5-7 min)`);
        if (cc.missingTopics.length > 0) {
            lines.push(`  Missing Topics:     ${cc.missingTopics.join(', ')}`);
        }
    }
    lines.push('');
    lines.push('  Instructions:');
    if (pageAudit.wordCount < 800) {
        lines.push(`  - Expand content to at least 800-1500 words. Current: ${pageAudit.wordCount}.`);
    }
    if (pageAudit.contentQuality && pageAudit.contentQuality.keywordDensity < 0.5) {
        lines.push(`  - Increase usage of "${report.keyword}" naturally throughout the content (target: 1-2% density).`);
    } else if (pageAudit.contentQuality && pageAudit.contentQuality.keywordDensity > 3) {
        lines.push(`  - Reduce keyword stuffing. Current density is ${pageAudit.contentQuality.keywordDensity}% (target: 1-2%).`);
    }
    if (pageAudit.contentComprehensiveness && !pageAudit.contentComprehensiveness.hasFAQ) {
        lines.push('  - Add a FAQ section with 5-8 questions and answers relevant to the target keyword.');
    }
    if (pageAudit.contentComprehensiveness && !pageAudit.contentComprehensiveness.hasTableOfContents) {
        lines.push('  - Add a Table of Contents with anchor links to each section for better UX and possible sitelinks.');
    }
    lines.push('');

    // ── 6. Image Optimization ───────────────────────────────────
    const missingAlt = pageAudit.images.filter(img => !img.hasAlt);
    const missingLazy = pageAudit.images.filter(img => !img.hasLazyLoading);
    if (pageAudit.images.length > 0) {
        lines.push('-'.repeat(70));
        lines.push('6. IMAGE OPTIMIZATION');
        lines.push('-'.repeat(70));
        lines.push(`  Total Images:       ${pageAudit.images.length}`);
        lines.push(`  Missing Alt Text:   ${missingAlt.length}`);
        lines.push(`  Missing Lazy Load:  ${missingLazy.length}`);
        lines.push('');
        lines.push('  Instructions:');
        if (missingAlt.length > 0) {
            lines.push('  - Add descriptive alt attributes to these images:');
            missingAlt.slice(0, 10).forEach(img => {
                lines.push(`    • ${img.src}`);
            });
            if (missingAlt.length > 10) {
                lines.push(`    ... and ${missingAlt.length - 10} more.`);
            }
        }
        if (missingLazy.length > 0) {
            lines.push('  - Add loading="lazy" to all below-the-fold images.');
        }
        lines.push('  - Ensure all images have explicit width and height attributes to prevent CLS.');
        lines.push('');
    }

    // ── 7. Performance & Core Web Vitals ────────────────────────
    if (vitals) {
        lines.push('-'.repeat(70));
        lines.push('7. PERFORMANCE & CORE WEB VITALS');
        lines.push('-'.repeat(70));
        lines.push(`  Performance Score:  ${vitals.performanceScore}/100`);
        lines.push(`  LCP:                ${(vitals.lcp / 1000).toFixed(2)}s (${vitals.lcpRating}) — target: < 2.5s`);
        lines.push(`  CLS:                ${vitals.cls} (${vitals.clsRating}) — target: < 0.1`);
        lines.push(`  INP:                ${vitals.inp}ms (${vitals.inpRating}) — target: < 200ms`);
        lines.push(`  FCP:                ${(vitals.fcp / 1000).toFixed(2)}s — target: < 1.8s`);
        lines.push(`  TBT:                ${vitals.tbt}ms — target: < 200ms`);
        lines.push('');
        lines.push('  Instructions:');
        if (vitals.lcpRating !== 'good') {
            lines.push('  - Optimize the largest contentful element: compress images, use WebP/AVIF, add preload hints.');
        }
        if (vitals.clsRating !== 'good') {
            lines.push('  - Fix layout shifts: add explicit dimensions to images/embeds, avoid injecting content above fold.');
        }
        if (vitals.inpRating !== 'good') {
            lines.push('  - Reduce interaction delays: defer non-critical JS, break up long tasks, use requestIdleCallback.');
        }
        if (pageAudit.pageBudget) {
            if (pageAudit.pageBudget.hasExcessiveJs) {
                lines.push(`  - Reduce JavaScript payload. Current: ${pageAudit.pageBudget.totalTransferSizeKb}KB across ${pageAudit.pageBudget.scriptCount} scripts.`);
            }
            if (pageAudit.pageBudget.renderBlockingCount > 0) {
                lines.push(`  - Eliminate ${pageAudit.pageBudget.renderBlockingCount} render-blocking resource(s). Use async/defer for scripts.`);
            }
        }
        lines.push('');
    }

    // ── 8. Security Headers ─────────────────────────────────────
    if (pageAudit.securityHeaders && pageAudit.securityHeaders.score < 6) {
        lines.push('-'.repeat(70));
        lines.push('8. SECURITY HEADERS');
        lines.push('-'.repeat(70));
        lines.push(`  Current Score: ${pageAudit.securityHeaders.score}/6`);
        lines.push('');
        lines.push('  Add the following headers to your server configuration:');
        if (!pageAudit.securityHeaders.hasHSTS) {
            lines.push('  - Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
        if (!pageAudit.securityHeaders.hasCSP) {
            lines.push("  - Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
        }
        if (!pageAudit.securityHeaders.hasXFrameOptions) {
            lines.push('  - X-Frame-Options: DENY');
        }
        if (!pageAudit.securityHeaders.hasXContentType) {
            lines.push('  - X-Content-Type-Options: nosniff');
        }
        if (!pageAudit.securityHeaders.hasReferrerPolicy) {
            lines.push('  - Referrer-Policy: strict-origin-when-cross-origin');
        }
        if (!pageAudit.securityHeaders.hasPermissionsPolicy) {
            lines.push('  - Permissions-Policy: camera=(), microphone=(), geolocation=()');
        }
        lines.push('');
    }

    // ── 9. E-E-A-T & Trust Signals ──────────────────────────────
    if (pageAudit.eeat) {
        lines.push('-'.repeat(70));
        lines.push('9. E-E-A-T & TRUST SIGNALS');
        lines.push('-'.repeat(70));
        lines.push(`  Trust Score:      ${pageAudit.eeat.trustScore}/100`);
        lines.push(`  Author Info:      ${pageAudit.eeat.hasAuthorInfo ? 'Present' : 'MISSING'}`);
        lines.push(`  About Page:       ${pageAudit.eeat.hasAboutPage ? 'Present' : 'MISSING'}`);
        lines.push(`  Contact Page:     ${pageAudit.eeat.hasContactPage ? 'Present' : 'MISSING'}`);
        lines.push(`  Privacy Policy:   ${pageAudit.eeat.hasPrivacyPolicy ? 'Present' : 'MISSING'}`);
        lines.push(`  Terms of Service: ${pageAudit.eeat.hasTermsOfService ? 'Present' : 'MISSING'}`);
        lines.push('');
        lines.push('  Instructions:');
        if (!pageAudit.eeat.hasAuthorInfo) {
            lines.push('  - Add author bylines with credentials/bio to content pages.');
        }
        if (!pageAudit.eeat.hasAboutPage) {
            lines.push('  - Create an About page with company/team information and expertise.');
        }
        if (!pageAudit.eeat.hasContactPage) {
            lines.push('  - Create a Contact page with physical address, phone, and email.');
        }
        if (!pageAudit.eeat.hasPrivacyPolicy) {
            lines.push('  - Add a Privacy Policy page (required for trust and compliance).');
        }
        if (!pageAudit.eeat.hasTermsOfService) {
            lines.push('  - Add a Terms of Service page.');
        }
        lines.push('');
    }

    // ── 10. Technical Fixes ─────────────────────────────────────
    const technicalItems: string[] = [];
    if (!pageAudit.isHttps) {
        technicalItems.push('Install and enforce HTTPS with SSL certificate.');
    }
    if (!pageAudit.hasSitemap) {
        technicalItems.push('Create and submit an XML sitemap at /sitemap.xml.');
    }
    if (!pageAudit.hasRobotsTxt) {
        technicalItems.push('Create a robots.txt file that references your sitemap.');
    }
    if (pageAudit.hasCanonicalMismatch) {
        technicalItems.push(`Fix canonical URL mismatch. Current canonical: ${pageAudit.indexability?.canonicalUrl || 'unknown'}`);
    }
    if (pageAudit.indexability?.hasRedirectChain) {
        technicalItems.push(`Eliminate redirect chain (${pageAudit.indexability.redirectCount} redirects). Use a single 301.`);
    }
    if (pageAudit.brokenLinks && pageAudit.brokenLinks.length > 0) {
        technicalItems.push(`Fix ${pageAudit.brokenLinks.length} broken link(s):`);
        pageAudit.brokenLinks.slice(0, 5).forEach(link => {
            technicalItems.push(`  • ${link.url} (status: ${link.statusCode || 'timeout'})`);
        });
    }
    if (pageAudit.accessibility && !pageAudit.accessibility.hasLangAttribute) {
        technicalItems.push('Add lang="en" attribute to the <html> element.');
    }
    if (pageAudit.accessibility && !pageAudit.accessibility.hasViewport) {
        technicalItems.push('Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>.');
    }

    if (technicalItems.length > 0) {
        lines.push('-'.repeat(70));
        lines.push('10. ADDITIONAL TECHNICAL FIXES');
        lines.push('-'.repeat(70));
        technicalItems.forEach((item, idx) => {
            lines.push(`  ${idx + 1}. ${item}`);
        });
        lines.push('');
    }

    // ── 11. Competitor Insights ──────────────────────────────────
    if (gapAnalyses.length > 0) {
        lines.push('-'.repeat(70));
        lines.push('11. COMPETITOR GAP ANALYSIS');
        lines.push('-'.repeat(70));
        lines.push('  Address these gaps where competitors are outperforming:');
        lines.push('');
        for (const gap of gapAnalyses.slice(0, 3)) {
            lines.push(`  vs ${gap.competitor.domain} (Rank #${gap.competitor.position}):`);
            const criticalMetrics = gap.metrics.filter(m => m.winner === 'competitor' && (m.severity === 'critical' || m.severity === 'warning'));
            criticalMetrics.forEach(m => {
                lines.push(`    • ${m.metric}: Theirs = ${m.competitorValue}, Yours = ${m.userValue}`);
            });
            if (gap.contentGap) {
                lines.push(`    Content Gap: ${gap.contentGap}`);
            }
            if (gap.technicalGap) {
                lines.push(`    Technical Gap: ${gap.technicalGap}`);
            }
            lines.push('');
        }
    }

    // ── 12. Quick Wins from AI Recommendations ──────────────────
    const quickWins = aiRecommendations.filter(r => r.effort === 'low' && r.impact === 'high');
    if (quickWins.length > 0) {
        lines.push('-'.repeat(70));
        lines.push('12. QUICK WINS (Low Effort, High Impact)');
        lines.push('-'.repeat(70));
        quickWins.forEach((rec, idx) => {
            lines.push(`  ${idx + 1}. ${rec.title}`);
            lines.push(`     ${rec.description}`);
        });
        lines.push('');
    }

    // ── Footer ──────────────────────────────────────────────────
    lines.push('='.repeat(70));
    lines.push('END OF SEO INSTRUCTIONS');
    lines.push('='.repeat(70));
    lines.push('');
    lines.push(`Generated by KeoFlex SEO Audit Tool on ${new Date().toLocaleDateString()}`);
    lines.push(`Audit URL: ${report.url} | Keyword: "${report.keyword}"`);

    return lines.join('\n');
}
