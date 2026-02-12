// ============================================================================
// KeoFlex SEO Audit Tool — Health Score Analyzer (Phase 2)
// ============================================================================

import type {
    PageAudit,
    CoreWebVitals,
    HealthScore,
    HealthCategory,
    HealthIssue,
} from './types';

/**
 * Calculate a comprehensive Health Score (0-100) from crawl data + vitals.
 * 
 * Phase 3 Scoring weights (15 categories, total = 100):
 * - Title Tag:              7 pts
 * - Meta Description:       6 pts
 * - Heading Structure:      7 pts
 * - Image Optimization:     6 pts
 * - Link Hygiene:           7 pts
 * - Content Depth:         10 pts
 * - Performance (CWV):     13 pts
 * - Security & Best Prac:   8 pts
 * - Schema/Structured Data: 5 pts
 * - Social Media Readiness: 4 pts
 * - Accessibility:          5 pts
 * - Content Quality:        4 pts
 * - Indexability:           7 pts  (NEW)
 * - E-E-A-T Signals:        6 pts  (NEW)
 * - Content Comprehensiveness: 5 pts (NEW)
 */
export function analyzeHealth(audit: PageAudit, vitals?: CoreWebVitals): HealthScore {
    const categories: HealthCategory[] = [];
    const allIssues: HealthIssue[] = [];

    // Phase 1 categories (rebalanced for Phase 3)
    const analyzers = [
        analyzeTitleTag(audit),           //  7 pts
        analyzeMetaDescription(audit),    //  6 pts
        analyzeHeadings(audit),           //  7 pts
        analyzeImages(audit),             //  6 pts
        analyzeLinks(audit),              //  7 pts
        analyzeContent(audit),            // 10 pts
        analyzePerformance(vitals),       // 13 pts
        analyzeSecurityBestPractices(audit), //  8 pts
        // Phase 2 categories
        analyzeSchema(audit),             //  5 pts
        analyzeSocialMeta(audit),         //  4 pts
        analyzeAccessibility(audit),      //  5 pts
        analyzeContentQuality(audit),     //  4 pts
        // Phase 3 categories
        analyzeIndexability(audit),       //  7 pts
        analyzeEEAT(audit),              //  6 pts
        analyzeContentComprehensiveness(audit), //  5 pts
    ];

    for (const cat of analyzers) {
        categories.push(cat);
        allIssues.push(...cat.issues);
    }

    // Calculate overall score
    const overall = Math.round(categories.reduce((sum, c) => sum + c.weightedScore, 0));
    const grade = getGrade(overall);

    // Sort issues by severity
    const severityOrder = { critical: 0, warning: 1, notice: 2 };
    allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return { overall, grade, categories, issues: allIssues };
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 65) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

// ============================================================================
// Phase 1 — Original Category Analyzers (Rebalanced Weights)
// ============================================================================

function analyzeTitleTag(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 7;

    if (!audit.meta.title) {
        score = 0;
        issues.push({
            severity: 'critical',
            category: 'Title Tag',
            message: 'Page is missing a title tag.',
            recommendation: 'Add a unique, descriptive <title> tag between 30-60 characters.',
        });
    } else {
        if (audit.meta.titleLength < 30) {
            score -= 40;
            issues.push({
                severity: 'warning',
                category: 'Title Tag',
                message: `Title tag is too short (${audit.meta.titleLength} chars).`,
                recommendation: 'Expand the title to 30-60 characters for optimal display in SERPs.',
            });
        } else if (audit.meta.titleLength > 60) {
            score -= 20;
            issues.push({
                severity: 'notice',
                category: 'Title Tag',
                message: `Title tag is too long (${audit.meta.titleLength} chars) and may be truncated.`,
                recommendation: 'Keep titles under 60 characters to prevent truncation in search results.',
            });
        }
    }

    score = Math.max(0, score);
    return { name: 'Title Tag', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

function analyzeMetaDescription(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 6;

    if (!audit.meta.description) {
        score = 0;
        issues.push({
            severity: 'critical',
            category: 'Meta Description',
            message: 'Page is missing a meta description.',
            recommendation: 'Add a compelling meta description between 120-160 characters.',
        });
    } else {
        if (audit.meta.descriptionLength < 120) {
            score -= 30;
            issues.push({
                severity: 'warning',
                category: 'Meta Description',
                message: `Meta description is short (${audit.meta.descriptionLength} chars).`,
                recommendation: 'Expand description to 120-160 characters for maximum SERP visibility.',
            });
        } else if (audit.meta.descriptionLength > 160) {
            score -= 15;
            issues.push({
                severity: 'notice',
                category: 'Meta Description',
                message: `Meta description may be truncated (${audit.meta.descriptionLength} chars).`,
                recommendation: 'Keep description under 160 characters.',
            });
        }
    }

    score = Math.max(0, score);
    return { name: 'Meta Description', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

function analyzeHeadings(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 7;

    const h1 = audit.headings.find((h) => h.tag === 'h1');

    if (!h1) {
        score -= 60;
        issues.push({
            severity: 'critical',
            category: 'Headings',
            message: 'Page is missing an H1 heading.',
            recommendation: 'Add a single, descriptive H1 tag that includes your primary keyword.',
        });
    } else if (h1.count > 1) {
        score -= 30;
        issues.push({
            severity: 'warning',
            category: 'Headings',
            message: `Multiple H1 tags found (${h1.count}).`,
            recommendation: 'Use only one H1 per page for clear topic signaling.',
        });
    }

    const h2 = audit.headings.find((h) => h.tag === 'h2');
    if (!h2) {
        score -= 20;
        issues.push({
            severity: 'notice',
            category: 'Headings',
            message: 'No H2 headings found.',
            recommendation: 'Use H2 tags to structure content into sections for better readability and SEO.',
        });
    }

    score = Math.max(0, score);
    return { name: 'Heading Structure', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

function analyzeImages(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 6;

    if (audit.images.length === 0) {
        score -= 20;
        issues.push({
            severity: 'notice',
            category: 'Images',
            message: 'No images found on the page.',
            recommendation: 'Add relevant images to improve engagement and provide visual context.',
        });
    } else {
        const missingAlt = audit.images.filter((img) => !img.hasAlt);
        if (missingAlt.length > 0) {
            const ratio = missingAlt.length / audit.images.length;
            score -= Math.round(ratio * 60);
            issues.push({
                severity: ratio > 0.5 ? 'critical' : 'warning',
                category: 'Images',
                message: `${missingAlt.length} of ${audit.images.length} images missing alt text.`,
                recommendation: 'Add descriptive alt text to all images for accessibility and SEO.',
            });
        }

        // Check for next-gen formats
        const nonNextGen = audit.images.filter(
            (img) => img.format && !['webp', 'avif', 'svg'].includes(img.format)
        );
        if (nonNextGen.length > audit.images.length * 0.5) {
            score -= 15;
            issues.push({
                severity: 'notice',
                category: 'Images',
                message: `${nonNextGen.length} images not using next-gen formats (WebP/AVIF).`,
                recommendation: 'Convert images to WebP or AVIF for smaller file sizes and faster loads.',
            });
        }

        // Check lazy loading
        const noLazy = audit.images.filter((img) => !img.hasLazyLoading);
        if (noLazy.length > 3) {
            score -= 10;
            issues.push({
                severity: 'notice',
                category: 'Images',
                message: `${noLazy.length} images without lazy loading.`,
                recommendation: 'Add loading="lazy" to below-the-fold images to improve initial load time.',
            });
        }
    }

    score = Math.max(0, score);
    return { name: 'Image Optimization', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

function analyzeLinks(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 7;

    if (audit.internalLinks.length === 0) {
        score -= 40;
        issues.push({
            severity: 'warning',
            category: 'Links',
            message: 'No internal links found.',
            recommendation: 'Add internal links to key pages to distribute PageRank and aid navigation.',
        });
    }

    // Use brokenLinks array from Phase 2 crawler
    if (audit.brokenLinks && audit.brokenLinks.length > 0) {
        score -= Math.min(60, audit.brokenLinks.length * 15);
        issues.push({
            severity: 'critical',
            category: 'Links',
            message: `${audit.brokenLinks.length} broken link(s) detected.`,
            recommendation: 'Fix or remove broken links to preserve crawl budget and user experience.',
        });
    }

    if (audit.internalLinks.length > 0 && audit.internalLinks.length < 3) {
        score -= 15;
        issues.push({
            severity: 'notice',
            category: 'Links',
            message: 'Very few internal links on the page.',
            recommendation: 'Add more internal links (5+) to related content for better crawlability.',
        });
    }

    score = Math.max(0, score);
    return { name: 'Link Hygiene', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

function analyzeContent(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 10;

    if (audit.wordCount < 100) {
        score = 10;
        issues.push({
            severity: 'critical',
            category: 'Content',
            message: `Very thin content (${audit.wordCount} words).`,
            recommendation: 'Expand content to at least 300 words for basic SEO. Target 1,000+ for competitive keywords.',
        });
    } else if (audit.wordCount < 300) {
        score = 40;
        issues.push({
            severity: 'warning',
            category: 'Content',
            message: `Content is thin (${audit.wordCount} words).`,
            recommendation: 'Target at least 300-500 words. Competitive keywords often require 1,000+.',
        });
    } else if (audit.wordCount < 600) {
        score = 65;
        issues.push({
            severity: 'notice',
            category: 'Content',
            message: `Moderate content (${audit.wordCount} words).`,
            recommendation: 'Consider expanding to 1,000+ words with supporting subtopics for competitive keywords.',
        });
    } else if (audit.wordCount < 1000) {
        score = 80;
    }

    score = Math.max(0, score);
    return { name: 'Content Depth', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

function analyzePerformance(vitals?: CoreWebVitals): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 13;

    if (!vitals) {
        score = 50;
        issues.push({
            severity: 'notice',
            category: 'Performance',
            message: 'Core Web Vitals data unavailable.',
            recommendation: 'Configure the PageSpeed API key to get real performance metrics.',
        });
    } else {
        score = vitals.performanceScore;

        if (vitals.lcpRating === 'poor') {
            issues.push({
                severity: 'critical',
                category: 'Performance',
                message: `LCP is poor (${(vitals.lcp / 1000).toFixed(1)}s). Target: under 2.5s.`,
                recommendation: 'Optimize largest content element: compress images, use CDN, reduce server response time.',
            });
        } else if (vitals.lcpRating === 'needs-improvement') {
            issues.push({
                severity: 'warning',
                category: 'Performance',
                message: `LCP needs improvement (${(vitals.lcp / 1000).toFixed(1)}s).`,
                recommendation: 'Optimize images and reduce main thread blocking to improve LCP.',
            });
        }

        if (vitals.clsRating === 'poor') {
            issues.push({
                severity: 'critical',
                category: 'Performance',
                message: `CLS is poor (${vitals.cls.toFixed(3)}). Target: under 0.1.`,
                recommendation: 'Add explicit dimensions to images/ads and avoid inserting content above existing content.',
            });
        }

        if (vitals.inpRating === 'poor') {
            issues.push({
                severity: 'warning',
                category: 'Performance',
                message: `INP is poor (${vitals.inp}ms). Target: under 200ms.`,
                recommendation: 'Reduce JavaScript execution time and break up long tasks.',
            });
        }
    }

    score = Math.max(0, score);
    return { name: 'Performance', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

function analyzeSecurityBestPractices(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 8;

    if (!audit.isHttps) {
        score -= 50;
        issues.push({
            severity: 'critical',
            category: 'Security',
            message: 'Site is not using HTTPS.',
            recommendation: 'Install an SSL certificate. HTTPS is a confirmed ranking signal.',
        });
    }

    if (!audit.hasRobotsTxt) {
        score -= 15;
        issues.push({
            severity: 'warning',
            category: 'Security',
            message: 'No robots.txt file found.',
            recommendation: 'Add a robots.txt to guide crawler behavior and protect sensitive paths.',
        });
    }

    if (!audit.hasSitemap) {
        score -= 15;
        issues.push({
            severity: 'warning',
            category: 'Security',
            message: 'No sitemap.xml found.',
            recommendation: 'Create and submit a sitemap.xml to help search engines discover your pages.',
        });
    }

    if (!audit.meta.canonical) {
        score -= 10;
        issues.push({
            severity: 'notice',
            category: 'Security',
            message: 'No canonical URL tag defined.',
            recommendation: 'Add a <link rel="canonical"> tag to prevent duplicate content issues.',
        });
    }

    // Check security headers
    if (audit.securityHeaders && audit.securityHeaders.score < 3) {
        score -= 10;
        issues.push({
            severity: 'warning',
            category: 'Security',
            message: `Only ${audit.securityHeaders.score}/6 security headers present.`,
            recommendation: 'Add HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers.',
        });
    }

    if (audit.hasCanonicalMismatch) {
        score -= 10;
        issues.push({
            severity: 'warning',
            category: 'Security',
            message: 'Canonical URL does not match the actual page URL.',
            recommendation: 'Ensure the canonical tag points to the correct, preferred URL of this page.',
        });
    }

    score = Math.max(0, score);
    return { name: 'Security & Best Practices', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

// ============================================================================
// Phase 2 — New Category Analyzers
// ============================================================================

/** Schema & Structured Data (7 pts) */
function analyzeSchema(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 5;

    if (!audit.schemaMarkup) {
        score = 30;
        issues.push({
            severity: 'warning',
            category: 'Schema',
            message: 'Schema data not available.',
            recommendation: 'Add JSON-LD structured data to help search engines understand your content.',
        });
    } else if (!audit.schemaMarkup.hasJsonLd && !audit.schemaMarkup.hasMicrodata) {
        score = 20;
        issues.push({
            severity: 'warning',
            category: 'Schema',
            message: 'No structured data (JSON-LD or Microdata) found.',
            recommendation: 'Add JSON-LD schema markup (Organization, WebPage, FAQ, etc.) to earn rich snippets in search results.',
        });
    } else {
        if (audit.schemaMarkup.types.length < 2) {
            score -= 30;
            issues.push({
                severity: 'notice',
                category: 'Schema',
                message: `Only ${audit.schemaMarkup.types.length} schema type(s) detected: ${audit.schemaMarkup.types.join(', ') || 'none'}.`,
                recommendation: 'Add additional schema types (e.g., Organization + WebPage + BreadcrumbList) for richer search presence.',
            });
        }

        if (!audit.schemaMarkup.hasJsonLd && audit.schemaMarkup.hasMicrodata) {
            score -= 15;
            issues.push({
                severity: 'notice',
                category: 'Schema',
                message: 'Using Microdata instead of JSON-LD.',
                recommendation: 'Google recommends JSON-LD as the preferred format for structured data.',
            });
        }
    }

    score = Math.max(0, score);
    return { name: 'Schema & Structured Data', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

/** Social Media Readiness (5 pts) */
function analyzeSocialMeta(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 4;

    if (!audit.socialMeta) {
        score = 30;
    } else {
        if (!audit.socialMeta.ogComplete) {
            score -= 40;
            const missing: string[] = [];
            if (!audit.meta.ogTitle) missing.push('og:title');
            if (!audit.meta.ogDescription) missing.push('og:description');
            if (!audit.meta.ogImage) missing.push('og:image');
            issues.push({
                severity: 'warning',
                category: 'Social',
                message: `Incomplete Open Graph tags. Missing: ${missing.join(', ')}.`,
                recommendation: 'Add og:title, og:description, and og:image for optimal social media sharing.',
            });
        }

        if (!audit.socialMeta.twitterComplete) {
            score -= 30;
            issues.push({
                severity: 'notice',
                category: 'Social',
                message: 'Missing or incomplete Twitter Card tags.',
                recommendation: 'Add twitter:card, twitter:title, and twitter:image for Twitter/X sharing previews.',
            });
        }
    }

    score = Math.max(0, score);
    return { name: 'Social Media Readiness', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

/** Accessibility Quick-Scan (6 pts) */
function analyzeAccessibility(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 5;

    if (!audit.accessibility) {
        score = 40;
    } else {
        if (!audit.accessibility.hasViewport) {
            score -= 40;
            issues.push({
                severity: 'critical',
                category: 'Accessibility',
                message: 'Missing viewport meta tag.',
                recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile responsiveness.',
            });
        }

        if (!audit.accessibility.hasLangAttribute) {
            score -= 25;
            issues.push({
                severity: 'warning',
                category: 'Accessibility',
                message: 'Missing lang attribute on <html> element.',
                recommendation: 'Add lang="en" (or appropriate language) to help screen readers and search engines.',
            });
        }

        if (audit.accessibility.totalImages > 0 && audit.accessibility.imagesWithoutAlt > 0) {
            const altCoverage = ((audit.accessibility.totalImages - audit.accessibility.imagesWithoutAlt) / audit.accessibility.totalImages) * 100;
            if (altCoverage < 80) {
                score -= 20;
                issues.push({
                    severity: 'warning',
                    category: 'Accessibility',
                    message: `Alt text coverage: ${altCoverage.toFixed(0)}% (${audit.accessibility.imagesWithoutAlt} images missing alt).`,
                    recommendation: 'Add descriptive alt text to all images. This is critical for screen readers and image SEO.',
                });
            }
        }

        if (audit.accessibility.formInputsWithoutLabel > 0) {
            score -= 15;
            issues.push({
                severity: 'notice',
                category: 'Accessibility',
                message: `${audit.accessibility.formInputsWithoutLabel} form input(s) without associated labels.`,
                recommendation: 'Add <label> elements or aria-label attributes to all form inputs for accessibility.',
            });
        }
    }

    score = Math.max(0, score);
    return { name: 'Accessibility', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

/** Content Quality — Readability & Keyword Optimization (5 pts) */
function analyzeContentQuality(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 4;

    if (!audit.contentQuality) {
        score = 50;
    } else {
        // Readability check
        if (audit.contentQuality.readabilityGrade > 14) {
            score -= 25;
            issues.push({
                severity: 'warning',
                category: 'Content Quality',
                message: `Reading level is very high (grade ${audit.contentQuality.readabilityGrade}). Avg sentence: ${audit.contentQuality.avgSentenceLength} words.`,
                recommendation: 'Simplify language. Target grade 8-12 for most web content. Use shorter sentences and simpler words.',
            });
        } else if (audit.contentQuality.readabilityGrade > 12) {
            score -= 10;
            issues.push({
                severity: 'notice',
                category: 'Content Quality',
                message: `Reading level is moderately high (grade ${audit.contentQuality.readabilityGrade}).`,
                recommendation: 'Consider simplifying some sections for broader audience appeal.',
            });
        }

        // Keyword in title
        if (!audit.contentQuality.hasKeywordInTitle && audit.contentQuality.keywordCount > 0) {
            score -= 25;
            issues.push({
                severity: 'warning',
                category: 'Content Quality',
                message: 'Target keyword not found in the title tag.',
                recommendation: 'Include your target keyword near the beginning of the title tag for maximum SEO impact.',
            });
        }

        // Keyword in H1
        if (!audit.contentQuality.hasKeywordInH1 && audit.contentQuality.keywordCount > 0) {
            score -= 20;
            issues.push({
                severity: 'notice',
                category: 'Content Quality',
                message: 'Target keyword not found in the H1 heading.',
                recommendation: 'Include your target keyword in the H1 heading to signal topical relevance.',
            });
        }

        // Keyword density
        if (audit.wordCount > 100) {
            if (audit.contentQuality.keywordDensity === 0) {
                score -= 25;
                issues.push({
                    severity: 'warning',
                    category: 'Content Quality',
                    message: 'Target keyword not found in page content.',
                    recommendation: 'Naturally incorporate your target keyword in the body content (aim for 1-3% density).',
                });
            } else if (audit.contentQuality.keywordDensity > 5) {
                score -= 20;
                issues.push({
                    severity: 'warning',
                    category: 'Content Quality',
                    message: `Keyword density is high (${audit.contentQuality.keywordDensity}%). Risk of keyword stuffing.`,
                    recommendation: 'Reduce keyword density to 1-3%. Use natural language variations and LSI keywords.',
                });
            }
        }
    }

    score = Math.max(0, score);
    return { name: 'Content Quality', score, maxScore, weightedScore: (score / 100) * maxScore, issues };
}

// ============================================================================
// Phase 3 — Google Ranking Dominance Analyzers
// ============================================================================

/** Indexability (7 pts) — can Google actually index and rank this page? */
function analyzeIndexability(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 100;
    const maxScore = 7;

    if (!audit.indexability) {
        return { name: 'Indexability', score: 50, maxScore, weightedScore: maxScore * 0.5, issues };
    }

    const idx = audit.indexability;

    // Critical: noindex blocks ranking entirely
    if (idx.hasNoindex) {
        score -= 100;
        issues.push({
            severity: 'critical',
            category: 'Indexability',
            message: 'Page has a noindex directive — Google will NOT index this page.',
            recommendation: 'Remove the noindex tag from meta robots or X-Robots-Tag header if you want this page to rank.',
        });
    }

    // Warning: nofollow reduces link equity flow
    if (idx.hasNofollow) {
        score -= 20;
        issues.push({
            severity: 'warning',
            category: 'Indexability',
            message: 'Page has a nofollow directive — links on this page won\'t pass PageRank.',
            recommendation: 'Remove nofollow unless you intentionally want to prevent link equity flow from this page.',
        });
    }

    // Warning: missing canonical
    if (idx.canonicalStatus === 'missing') {
        score -= 15;
        issues.push({
            severity: 'warning',
            category: 'Indexability',
            message: 'No canonical URL specified.',
            recommendation: 'Add a <link rel="canonical"> tag to prevent duplicate content issues and consolidate ranking signals.',
        });
    }

    // Critical: canonical mismatch
    if (idx.canonicalStatus === 'mismatch') {
        score -= 30;
        issues.push({
            severity: 'critical',
            category: 'Indexability',
            message: `Canonical URL mismatch: canonical points to "${idx.canonicalUrl}" but the page URL is different.`,
            recommendation: 'Fix the canonical tag to point to the correct URL. Mismatched canonicals confuse Google about which URL to index.',
        });
    }

    // Warning: redirect chain detected
    if (idx.hasRedirectChain) {
        score -= 10;
        issues.push({
            severity: 'warning',
            category: 'Indexability',
            message: 'URL redirects detected. Redirect chains waste crawl budget and dilute PageRank.',
            recommendation: 'Update links to point directly to the final URL to eliminate redirect hops.',
        });
    }

    score = Math.max(0, score);
    return {
        name: 'Indexability',
        score: Math.round(score),
        maxScore,
        weightedScore: Math.round(score * maxScore) / 100,
        issues,
    };
}

/** E-E-A-T Signals (6 pts) — Experience, Expertise, Authority, Trust */
function analyzeEEAT(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 0; // Build score up based on signals found
    const maxScore = 6;

    if (!audit.eeat) {
        return { name: 'E-E-A-T Signals', score: 0, maxScore, weightedScore: 0, issues };
    }

    const eeat = audit.eeat;

    if (eeat.hasAuthorInfo) {
        score += 20;
    } else {
        issues.push({
            severity: 'warning',
            category: 'E-E-A-T',
            message: 'No author information detected.',
            recommendation: 'Add author bylines with credentials/bio to demonstrate expertise. Google values identifiable authors.',
        });
    }

    if (eeat.hasAboutPage) {
        score += 15;
    } else {
        issues.push({
            severity: 'warning',
            category: 'E-E-A-T',
            message: 'No link to an About page found.',
            recommendation: 'Add an About page that details your organization\'s expertise, history, and mission.',
        });
    }

    if (eeat.hasContactPage) {
        score += 15;
    } else {
        issues.push({
            severity: 'notice',
            category: 'E-E-A-T',
            message: 'No link to a Contact page found.',
            recommendation: 'Add a Contact page with email, phone, and physical address for trustworthiness.',
        });
    }

    if (eeat.hasPrivacyPolicy) {
        score += 15;
    } else {
        issues.push({
            severity: 'warning',
            category: 'E-E-A-T',
            message: 'No Privacy Policy linked.',
            recommendation: 'Add a Privacy Policy page to build trust and comply with regulations (GDPR, CCPA).',
        });
    }

    if (eeat.hasTermsOfService) {
        score += 10;
    }

    // Bonus signals
    if (eeat.signals.includes('Copyright notice')) score += 5;
    if (eeat.signals.includes('Physical address present')) score += 10;
    if (eeat.signals.includes('Social media profiles linked')) score += 10;

    score = Math.min(100, score);

    return {
        name: 'E-E-A-T Signals',
        score: Math.round(score),
        maxScore,
        weightedScore: Math.round(score * maxScore) / 100,
        issues,
    };
}

/** Content Comprehensiveness (5 pts) — topical depth and authority signals */
function analyzeContentComprehensiveness(audit: PageAudit): HealthCategory {
    const issues: HealthIssue[] = [];
    let score = 0;
    const maxScore = 5;

    if (!audit.contentComprehensiveness) {
        return { name: 'Content Compr.', score: 0, maxScore, weightedScore: 0, issues };
    }

    const cc = audit.contentComprehensiveness;

    // Topic coverage via headings
    if (cc.contentSections >= 5) {
        score += 25;
    } else if (cc.contentSections >= 3) {
        score += 15;
    } else {
        issues.push({
            severity: 'warning',
            category: 'Content Comprehensiveness',
            message: `Only ${cc.contentSections} content section(s) found. Top-ranking pages typically have 5+ sections.`,
            recommendation: 'Add more H2-based sections covering related subtopics to demonstrate comprehensive authority.',
        });
        score += 5;
    }

    // Topic breadth
    if (cc.topicCoverage.length >= 8) {
        score += 20;
    } else if (cc.topicCoverage.length >= 4) {
        score += 10;
    } else {
        issues.push({
            severity: 'notice',
            category: 'Content Comprehensiveness',
            message: `Only ${cc.topicCoverage.length} distinct topic(s) covered in headings.`,
            recommendation: 'Expand content with subheadings covering FAQs, use cases, comparisons, and related concepts.',
        });
    }

    // FAQ presence
    if (cc.hasFAQ) {
        score += 15;
    } else {
        issues.push({
            severity: 'notice',
            category: 'Content Comprehensiveness',
            message: 'No FAQ section detected.',
            recommendation: 'Add a FAQ section to target "People Also Ask" boxes and improve featured snippet eligibility.',
        });
    }

    // Table of Contents
    if (cc.hasTableOfContents) {
        score += 10;
    }

    // Entity/concept density
    if (cc.entityCount >= 10) {
        score += 15;
    } else if (cc.entityCount >= 5) {
        score += 8;
    }

    // Read time (longer content generally ranks better)
    if (cc.estimatedReadTimeMin >= 5) {
        score += 15;
    } else if (cc.estimatedReadTimeMin >= 3) {
        score += 8;
    } else {
        issues.push({
            severity: 'notice',
            category: 'Content Comprehensiveness',
            message: `Estimated read time is only ${cc.estimatedReadTimeMin} minute(s). Top-ranking content averages 5-7 minutes.`,
            recommendation: 'Expand content depth with examples, data, and detailed explanations.',
        });
    }

    score = Math.min(100, score);

    return {
        name: 'Content Compr.',
        score: Math.round(score),
        maxScore,
        weightedScore: Math.round(score * maxScore) / 100,
        issues,
    };
}
