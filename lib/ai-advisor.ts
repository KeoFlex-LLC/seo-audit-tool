// ============================================================================
// KeoFlex SEO Audit Tool — Gemini AI Advisor (Secondary Layer)
// ============================================================================

import type { PageAudit, CoreWebVitals, GapAnalysis, AIRecommendation } from './types';

/**
 * Generate strategic SEO recommendations using Gemini AI.
 * Falls back to deterministic rule-based advice if no API key is set.
 */
export async function generateAIRecommendations(
    userAudit: PageAudit,
    userVitals: CoreWebVitals | undefined,
    gapAnalyses: GapAnalysis[]
): Promise<AIRecommendation[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
        try {
            return await fetchGeminiAdvice(userAudit, userVitals, gapAnalyses, apiKey);
        } catch (error) {
            console.warn('[AI] Gemini request failed, using rule-based fallback:', error);
        }
    }

    return generateRuleBasedAdvice(userAudit, userVitals, gapAnalyses);
}

// --- Gemini Integration ---

async function fetchGeminiAdvice(
    userAudit: PageAudit,
    userVitals: CoreWebVitals | undefined,
    gapAnalyses: GapAnalysis[],
    apiKey: string
): Promise<AIRecommendation[]> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const auditSummary = buildAuditSummary(userAudit, userVitals, gapAnalyses);

    const prompt = `You are a Senior SEO Strategist. Based on this site audit data, provide exactly 5 prioritized, actionable strategies to improve SEO rankings. Be specific and reference exact metrics from the data.

AUDIT DATA:
${auditSummary}

Respond ONLY with a valid JSON array. Each item must have:
- "priority" (number 1-5, 1 = most important)
- "title" (short action title)
- "description" (2-3 sentences with specific, metric-driven advice)
- "effort" ("low", "medium", or "high")
- "impact" ("low", "medium", or "high")
- "category" ("content", "technical", "performance", or "strategy")

Example format:
[{"priority":1,"title":"...","description":"...","effort":"low","impact":"high","category":"content"}]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI response as JSON');
    }

    const recommendations: AIRecommendation[] = JSON.parse(jsonMatch[0]);
    return recommendations.slice(0, 5);
}

// --- Rule-Based Fallback ---

function generateRuleBasedAdvice(
    userAudit: PageAudit,
    userVitals: CoreWebVitals | undefined,
    gapAnalyses: GapAnalysis[]
): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    let priority = 1;

    // Critical: Missing/bad title
    if (!userAudit.meta.title || userAudit.meta.titleLength < 20) {
        recommendations.push({
            priority: priority++,
            title: 'Optimize Title Tag',
            description: `Your title tag is ${!userAudit.meta.title ? 'missing' : `only ${userAudit.meta.titleLength} characters`}. Write a compelling, keyword-rich title between 30-60 characters that accurately describes your page content.`,
            effort: 'low',
            impact: 'high',
            category: 'content',
        });
    }

    // Critical: Missing meta description
    if (!userAudit.meta.description) {
        recommendations.push({
            priority: priority++,
            title: 'Add Meta Description',
            description: 'Your page has no meta description. Add a compelling 120-160 character description that includes your target keyword to improve click-through rates from search results.',
            effort: 'low',
            impact: 'high',
            category: 'content',
        });
    }

    // Performance issues
    if (userVitals && userVitals.performanceScore < 70) {
        recommendations.push({
            priority: priority++,
            title: 'Improve Page Performance',
            description: `Your performance score is ${userVitals.performanceScore}/100. ${userVitals.lcpRating === 'poor'
                ? `LCP is ${(userVitals.lcp / 1000).toFixed(1)}s (target: under 2.5s). Optimize your largest content element by compressing images and using a CDN.`
                : userVitals.clsRating === 'poor'
                    ? `CLS is ${userVitals.cls} (target: under 0.1). Add explicit dimensions to images and avoid injecting content above the fold.`
                    : 'Focus on reducing Total Blocking Time by deferring non-critical JavaScript.'
                }`,
            effort: 'medium',
            impact: 'high',
            category: 'performance',
        });
    }

    // Content depth
    if (userAudit.wordCount < 500) {
        const topCompetitor = gapAnalyses.find((g) => g.competitor.audit);
        const compWords = topCompetitor?.competitor.audit?.wordCount || 1500;
        recommendations.push({
            priority: priority++,
            title: 'Expand Content Depth',
            description: `Your page has only ${userAudit.wordCount} words${topCompetitor ? `, while the top competitor has ${compWords} words` : ''
                }. Add comprehensive sections covering related subtopics, FAQs, and supporting data to establish topical authority.`,
            effort: 'high',
            impact: 'high',
            category: 'content',
        });
    }

    // Image optimization
    const missingAlt = userAudit.images.filter((img) => !img.hasAlt);
    if (missingAlt.length > 0) {
        recommendations.push({
            priority: priority++,
            title: 'Fix Image Alt Text',
            description: `${missingAlt.length} of ${userAudit.images.length} images are missing alt text. Add descriptive, keyword-relevant alt attributes to all images for accessibility and image search visibility.`,
            effort: 'low',
            impact: 'medium',
            category: 'technical',
        });
    }

    // HTTPS check
    if (!userAudit.isHttps) {
        recommendations.push({
            priority: priority++,
            title: 'Enable HTTPS',
            description: 'Your site is not using HTTPS. Install an SSL certificate immediately—HTTPS is a confirmed Google ranking signal and visitors see security warnings on HTTP sites.',
            effort: 'medium',
            impact: 'high',
            category: 'technical',
        });
    }

    // Sitemap/Robots
    if (!userAudit.hasSitemap) {
        recommendations.push({
            priority: priority++,
            title: 'Create XML Sitemap',
            description: 'No sitemap.xml was detected. Create and submit an XML sitemap to Google Search Console to help search engines discover and index your pages efficiently.',
            effort: 'low',
            impact: 'medium',
            category: 'technical',
        });
    }

    // Competitor gap insights
    if (gapAnalyses.length > 0) {
        const critGaps = gapAnalyses[0]?.metrics.filter(
            (m) => m.severity === 'critical' && m.winner === 'competitor'
        );
        if (critGaps && critGaps.length > 0) {
            recommendations.push({
                priority: priority++,
                title: 'Close Competitor Gaps',
                description: `Your top competitor leads in ${critGaps.length} critical metric(s): ${critGaps
                    .map((g) => `${g.metric} (${g.competitorValue} vs your ${g.userValue})`)
                    .join(', ')}. Prioritize closing these gaps to become competitive.`,
                effort: 'medium',
                impact: 'high',
                category: 'strategy',
            });
        }
    }

    // Heading structure
    const h1 = userAudit.headings.find((h) => h.tag === 'h1');
    if (!h1) {
        recommendations.push({
            priority: priority++,
            title: 'Add H1 Heading',
            description: 'Your page is missing an H1 heading. Add a single, descriptive H1 that includes your primary keyword. This is one of the strongest on-page SEO signals.',
            effort: 'low',
            impact: 'high',
            category: 'content',
        });
    }

    // Internal linking
    if (userAudit.internalLinks.length < 5) {
        recommendations.push({
            priority: priority++,
            title: 'Strengthen Internal Linking',
            description: `Your page has only ${userAudit.internalLinks.length} internal links. Add contextual internal links to related pages to distribute link equity and improve crawlability.`,
            effort: 'low',
            impact: 'medium',
            category: 'technical',
        });
    }

    // Phase 2: Schema markup
    if (userAudit.schemaMarkup && !userAudit.schemaMarkup.hasJsonLd && !userAudit.schemaMarkup.hasMicrodata) {
        recommendations.push({
            priority: priority++,
            title: 'Add Structured Data (Schema Markup)',
            description: 'No JSON-LD or Microdata structured data detected. Add schema markup (Organization, WebPage, FAQ, BreadcrumbList) to help search engines understand your content and earn rich snippets.',
            effort: 'medium',
            impact: 'medium',
            category: 'technical',
        });
    }

    // Phase 2: Security headers
    if (userAudit.securityHeaders && userAudit.securityHeaders.score < 3) {
        recommendations.push({
            priority: priority++,
            title: 'Implement Security Headers',
            description: `Only ${userAudit.securityHeaders.score}/6 security headers are present. Add Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, and other security headers to protect users and signal trustworthiness.`,
            effort: 'medium',
            impact: 'medium',
            category: 'technical',
        });
    }

    // Phase 2: Social meta
    if (userAudit.socialMeta && !userAudit.socialMeta.ogComplete) {
        recommendations.push({
            priority: priority++,
            title: 'Complete Social Media Tags',
            description: 'Open Graph tags are incomplete. Add og:title, og:description, and og:image to ensure your page looks professional when shared on social media platforms.',
            effort: 'low',
            impact: 'medium',
            category: 'content',
        });
    }

    // Phase 2: Accessibility
    if (userAudit.accessibility && !userAudit.accessibility.hasLangAttribute) {
        recommendations.push({
            priority: priority++,
            title: 'Add Language Attribute',
            description: 'The <html> element is missing a lang attribute. Add lang="en" (or the appropriate language) to help screen readers and search engines understand your content\'s language.',
            effort: 'low',
            impact: 'low',
            category: 'technical',
        });
    }

    // Phase 2: Content quality — keyword placement
    if (userAudit.contentQuality && !userAudit.contentQuality.hasKeywordInTitle) {
        recommendations.push({
            priority: priority++,
            title: 'Add Keyword to Title Tag',
            description: 'Your target keyword is not present in the title tag. Include it near the beginning for maximum SEO impact — the title tag is the strongest on-page ranking signal.',
            effort: 'low',
            impact: 'high',
            category: 'content',
        });
    }

    // Phase 2: Broken links
    if (userAudit.brokenLinks && userAudit.brokenLinks.length > 0) {
        recommendations.push({
            priority: priority++,
            title: 'Fix Broken Links',
            description: `${userAudit.brokenLinks.length} broken link(s) detected on the page. Broken links waste crawl budget and create poor user experiences. Fix or remove them immediately.`,
            effort: 'low',
            impact: 'medium',
            category: 'technical',
        });
    }

    // Phase 3: Indexability
    if (userAudit.indexability && !userAudit.indexability.isIndexable) {
        recommendations.unshift({
            priority: 1,
            title: '⛔ Page Is NOT Indexable — Fix Immediately',
            description: `Google cannot index this page due to ${userAudit.indexability.hasNoindex ? 'a noindex directive' : 'a canonical mismatch'}. None of your SEO efforts matter until this is fixed. Remove the blocking directive to allow indexing.`,
            effort: 'low',
            impact: 'high',
            category: 'technical',
        });
        priority++;
    }

    // Phase 3: E-E-A-T
    if (userAudit.eeat && userAudit.eeat.trustScore < 50) {
        recommendations.push({
            priority: priority++,
            title: 'Strengthen E-E-A-T Trust Signals',
            description: `Your E-E-A-T trust score is ${userAudit.eeat.trustScore}/100. ${!userAudit.eeat.hasAuthorInfo ? 'Add author bylines with credentials. ' : ''}${!userAudit.eeat.hasAboutPage ? 'Create an About page. ' : ''}${!userAudit.eeat.hasPrivacyPolicy ? 'Add a Privacy Policy. ' : ''}Google increasingly values trust signals for ranking.`,
            effort: 'medium',
            impact: 'high',
            category: 'strategy',
        });
    }

    // Phase 3: Content Comprehensiveness
    if (userAudit.contentComprehensiveness) {
        const cc = userAudit.contentComprehensiveness;
        if (!cc.hasFAQ) {
            recommendations.push({
                priority: priority++,
                title: 'Add FAQ Section for "People Also Ask"',
                description: 'No FAQ section detected. Adding a FAQ section with schema markup can earn "People Also Ask" rich results, increasing visibility and CTR by 20-30%.',
                effort: 'low',
                impact: 'high',
                category: 'content',
            });
        }
        if (cc.estimatedReadTimeMin < 3) {
            recommendations.push({
                priority: priority++,
                title: 'Deepen Content for Topical Authority',
                description: `Content read time is only ${cc.estimatedReadTimeMin} min. Top-ranking pages average 5-7 minutes. Add case studies, data, expert quotes, and examples to demonstrate comprehensive expertise.`,
                effort: 'high',
                impact: 'high',
                category: 'content',
            });
        }
    }

    // Phase 3: Rich Results
    if (userAudit.richResults && userAudit.richResults.missing.length > 3) {
        recommendations.push({
            priority: priority++,
            title: 'Unlock Google Rich Results',
            description: `You're missing ${userAudit.richResults.missing.length} rich result opportunities: ${userAudit.richResults.missing.slice(0, 3).join(', ')}. Adding structured data for these can boost CTR by up to 58%.`,
            effort: 'medium',
            impact: 'high',
            category: 'technical',
        });
    }

    // --- Always-On Baseline Strategies ---
    // If site passes all critical checks, provide proactive growth strategies

    if (recommendations.length < 3) {
        // Content expansion is always beneficial
        recommendations.push({
            priority: priority++,
            title: 'Add Structured Data (Schema Markup)',
            description: `Add JSON-LD schema markup (e.g., Organization, WebPage, FAQ) to help search engines understand your content and potentially earn rich snippets in search results.`,
            effort: 'medium',
            impact: 'medium',
            category: 'technical',
        });

        // Strategic internal linking
        recommendations.push({
            priority: priority++,
            title: 'Build Topic Clusters',
            description: `Create supporting blog posts or resource pages around your primary keyword and interlink them with your main page. This establishes topical authority and increases organic traffic across multiple queries.`,
            effort: 'high',
            impact: 'high',
            category: 'strategy',
        });

        // Page speed is always improvable
        if (userVitals && userVitals.performanceScore < 95) {
            recommendations.push({
                priority: priority++,
                title: 'Optimize for Perfect Performance Score',
                description: `Your performance score is ${userVitals.performanceScore}/100—good, but there's room to reach 95+. Audit third-party scripts, implement lazy loading for below-the-fold images, and consider a CDN for global reach.`,
                effort: 'medium',
                impact: 'medium',
                category: 'performance',
            });
        }

        // Content freshness
        recommendations.push({
            priority: priority++,
            title: 'Implement Content Freshness Strategy',
            description: 'Schedule regular content updates to signal relevance to search engines. Add a "Last Updated" date, refresh statistics, and expand sections based on new industry developments.',
            effort: 'low',
            impact: 'medium',
            category: 'content',
        });

        // Competitor monitoring
        if (gapAnalyses.length > 0) {
            recommendations.push({
                priority: priority++,
                title: 'Monitor Competitor Content Shifts',
                description: `You're competing against ${gapAnalyses.length} identified rival(s). Set up regular monitoring of their content strategy, new pages, and backlink acquisitions to stay ahead of ranking movements.`,
                effort: 'low',
                impact: 'medium',
                category: 'strategy',
            });
        }
    }

    // Return top 5, sorted by priority
    return recommendations.slice(0, 5).map((r, i) => ({ ...r, priority: i + 1 }));
}

// --- Helpers ---

function buildAuditSummary(
    audit: PageAudit,
    vitals: CoreWebVitals | undefined,
    gaps: GapAnalysis[]
): string {
    const parts: string[] = [];

    parts.push(`URL: ${audit.url}`);
    parts.push(`Title: "${audit.meta.title}" (${audit.meta.titleLength} chars)`);
    parts.push(`Description: "${audit.meta.description}" (${audit.meta.descriptionLength} chars)`);
    parts.push(`Word Count: ${audit.wordCount}`);
    parts.push(`H1: ${audit.headings.find((h) => h.tag === 'h1')?.text || 'MISSING'}`);
    parts.push(`Images: ${audit.images.length} (${audit.images.filter((i) => i.hasAlt).length} with alt)`);
    parts.push(`Internal Links: ${audit.internalLinks.length}`);
    parts.push(`HTTPS: ${audit.isHttps ? 'Yes' : 'No'}`);
    parts.push(`Sitemap: ${audit.hasSitemap ? 'Yes' : 'No'}`);
    parts.push(`Robots.txt: ${audit.hasRobotsTxt ? 'Yes' : 'No'}`);

    // Phase 2 additions
    if (audit.schemaMarkup) {
        parts.push(`\nSchema: ${audit.schemaMarkup.hasJsonLd ? 'JSON-LD' : ''} ${audit.schemaMarkup.hasMicrodata ? 'Microdata' : ''} Types: ${audit.schemaMarkup.types.join(', ') || 'None'}`);
    }
    if (audit.securityHeaders) {
        parts.push(`Security Headers: ${audit.securityHeaders.score}/6`);
    }
    if (audit.contentQuality) {
        parts.push(`Readability Grade: ${audit.contentQuality.readabilityGrade}`);
        parts.push(`Keyword Density: ${audit.contentQuality.keywordDensity}%`);
        parts.push(`Keyword in Title: ${audit.contentQuality.hasKeywordInTitle ? 'Yes' : 'No'}`);
        parts.push(`Keyword in H1: ${audit.contentQuality.hasKeywordInH1 ? 'Yes' : 'No'}`);
    }
    if (audit.socialMeta) {
        parts.push(`Open Graph Complete: ${audit.socialMeta.ogComplete ? 'Yes' : 'No'}`);
        parts.push(`Twitter Card: ${audit.socialMeta.twitterCard || 'Missing'}`);
    }
    if (audit.accessibility) {
        parts.push(`Viewport: ${audit.accessibility.hasViewport ? 'Yes' : 'No'}`);
        parts.push(`Lang Attribute: ${audit.accessibility.langValue || 'Missing'}`);
    }
    if (audit.brokenLinks && audit.brokenLinks.length > 0) {
        parts.push(`Broken Links: ${audit.brokenLinks.length}`);
    }

    // Phase 3 additions
    if (audit.indexability) {
        parts.push(`\nIndexable: ${audit.indexability.isIndexable ? 'Yes' : 'NO — BLOCKED'}`);
        parts.push(`Canonical Status: ${audit.indexability.canonicalStatus}`);
        parts.push(`Has noindex: ${audit.indexability.hasNoindex}`);
        parts.push(`Has nofollow: ${audit.indexability.hasNofollow}`);
    }
    if (audit.eeat) {
        parts.push(`\nE-E-A-T Trust Score: ${audit.eeat.trustScore}/100`);
        parts.push(`Author Info: ${audit.eeat.hasAuthorInfo ? 'Yes' : 'No'}`);
        parts.push(`About Page: ${audit.eeat.hasAboutPage ? 'Yes' : 'No'}`);
        parts.push(`Contact Page: ${audit.eeat.hasContactPage ? 'Yes' : 'No'}`);
        parts.push(`Privacy Policy: ${audit.eeat.hasPrivacyPolicy ? 'Yes' : 'No'}`);
        if (audit.eeat.signals.length > 0) {
            parts.push(`Trust Signals: ${audit.eeat.signals.join(', ')}`);
        }
    }
    if (audit.contentComprehensiveness) {
        parts.push(`\nContent Sections: ${audit.contentComprehensiveness.contentSections}`);
        parts.push(`Topics Covered: ${audit.contentComprehensiveness.topicCoverage.join(', ')}`);
        parts.push(`Has FAQ: ${audit.contentComprehensiveness.hasFAQ ? 'Yes' : 'No'}`);
        parts.push(`Has ToC: ${audit.contentComprehensiveness.hasTableOfContents ? 'Yes' : 'No'}`);
        parts.push(`Estimated Read Time: ${audit.contentComprehensiveness.estimatedReadTimeMin} min`);
        parts.push(`Entity Count: ${audit.contentComprehensiveness.entityCount}`);
    }
    if (audit.richResults) {
        parts.push(`\nRich Results Eligible: ${audit.richResults.eligible.join(', ') || 'None'}`);
        parts.push(`Rich Results Missing: ${audit.richResults.missing.join(', ')}`);
        parts.push(`CTR Boost Potential: ${audit.richResults.potentialCTRBoost}`);
    }
    if (audit.pageBudget) {
        parts.push(`\nTotal Transfer Size: ${audit.pageBudget.totalTransferSizeKb}KB`);
        parts.push(`Scripts: ${audit.pageBudget.scriptCount}`);
        parts.push(`Stylesheets: ${audit.pageBudget.stylesheetCount}`);
        parts.push(`Render-Blocking Resources: ${audit.pageBudget.renderBlockingCount}`);
        parts.push(`Excessive JS: ${audit.pageBudget.hasExcessiveJs ? 'Yes' : 'No'}`);
    }

    if (vitals) {
        parts.push(`\nPerformance Score: ${vitals.performanceScore}/100`);
        parts.push(`LCP: ${vitals.lcp}ms (${vitals.lcpRating})`);
        parts.push(`CLS: ${vitals.cls} (${vitals.clsRating})`);
        parts.push(`INP: ${vitals.inp}ms (${vitals.inpRating})`);
    }

    if (gaps.length > 0) {
        parts.push('\nCompetitor Gaps:');
        for (const gap of gaps) {
            parts.push(`  vs ${gap.competitor.domain} (#${gap.competitor.position}):`);
            for (const m of gap.metrics) {
                parts.push(`    ${m.metric}: You=${m.userValue}, Them=${m.competitorValue} → ${m.winner} wins`);
            }
        }
    }

    return parts.join('\n');
}
