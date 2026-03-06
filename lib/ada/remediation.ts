// ============================================================================
// KeoFlex ADA Compliance Module — Remediation Knowledge Base
// ============================================================================
// Enhanced fix guidance for the most common axe-core violations.
// Falls back to axe-core's default helpUrl for unlisted rules.
// ============================================================================

import type { RemediationEntry } from './types';

const REMEDIATION_DB: RemediationEntry[] = [
    // ========================================================================
    // PERCEIVABLE
    // ========================================================================
    {
        ruleId: 'image-alt',
        title: 'Images must have alternate text',
        explanation:
            'Screen readers announce images using alt text. Without it, visually impaired users cannot understand the image content. Search engines also use alt text to index images.',
        beforeCode: '<img src="hero.jpg">',
        afterCode: '<img src="hero.jpg" alt="Team collaborating in a modern office">',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#non-text-content',
        seoImpact: 'Alt text is a direct image SEO ranking factor. Missing alt text means images will not appear in Google Image search.',
    },
    {
        ruleId: 'color-contrast',
        title: 'Elements must have sufficient color contrast',
        explanation:
            'Text must have a contrast ratio of at least 4.5:1 against its background (3:1 for large text). Low contrast makes text unreadable for users with low vision or color blindness.',
        beforeCode: '<p style="color: #aaa; background: #fff;">Hard to read text</p>',
        afterCode: '<p style="color: #595959; background: #fff;">Easy to read text</p>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#contrast-minimum',
    },
    {
        ruleId: 'label',
        title: 'Form elements must have labels',
        explanation:
            'Every form input needs an associated <label> element or aria-label attribute so screen readers can announce what the field is for.',
        beforeCode: '<input type="email" placeholder="Enter email">',
        afterCode: '<label for="email">Email Address</label>\n<input type="email" id="email" placeholder="Enter email">',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#labels-or-instructions',
    },
    {
        ruleId: 'input-image-alt',
        title: 'Image buttons must have alternate text',
        explanation:
            'Input elements with type="image" function as buttons. They need alt text describing the action (e.g., "Submit", "Search").',
        beforeCode: '<input type="image" src="submit.png">',
        afterCode: '<input type="image" src="submit.png" alt="Submit form">',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#non-text-content',
    },
    {
        ruleId: 'video-caption',
        title: 'Videos must have captions',
        explanation:
            'Prerecorded video content in synchronized media must have captions for deaf or hard-of-hearing users.',
        beforeCode: '<video src="demo.mp4" controls></video>',
        afterCode: '<video src="demo.mp4" controls>\n  <track kind="captions" src="demo.vtt" srclang="en" label="English">\n</video>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#captions-prerecorded',
    },

    // ========================================================================
    // OPERABLE
    // ========================================================================
    {
        ruleId: 'heading-order',
        title: 'Heading levels should increase by one',
        explanation:
            'Heading hierarchy should not skip levels (e.g., going from <h1> to <h3>). This breaks the document outline for screen reader users and confuses search engine crawlers.',
        beforeCode: '<h1>Main Title</h1>\n<h3>Subsection</h3>',
        afterCode: '<h1>Main Title</h1>\n<h2>Subsection</h2>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
        seoImpact: 'Proper heading hierarchy helps Google understand content structure and can improve featured snippet eligibility.',
    },
    {
        ruleId: 'link-name',
        title: 'Links must have discernible text',
        explanation:
            'Every link needs visible text, an aria-label, or an aria-labelledby attribute so screen readers and search engines can understand the link purpose.',
        beforeCode: '<a href="/about"><img src="icon.svg"></a>',
        afterCode: '<a href="/about" aria-label="About us"><img src="icon.svg" alt=""></a>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#link-purpose-in-context',
        seoImpact: 'Link text is a core anchor text signal for SEO. Empty links waste link equity.',
    },
    {
        ruleId: 'button-name',
        title: 'Buttons must have discernible text',
        explanation:
            'Buttons need visible text content, an aria-label, or aria-labelledby so assistive technologies can announce the button purpose.',
        beforeCode: '<button><svg>...</svg></button>',
        afterCode: '<button aria-label="Close menu"><svg>...</svg></button>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'bypass',
        title: 'Page must have means to bypass repeated blocks',
        explanation:
            'Pages should provide a "Skip to main content" link so keyboard users can bypass navigation menus.',
        beforeCode: '<body>\n  <nav>... long navigation ...</nav>\n  <main>Content</main>\n</body>',
        afterCode: '<body>\n  <a href="#main" class="skip-link">Skip to main content</a>\n  <nav>... long navigation ...</nav>\n  <main id="main">Content</main>\n</body>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#bypass-blocks',
    },
    {
        ruleId: 'document-title',
        title: 'Documents must have a <title> element',
        explanation:
            'The page title is announced by screen readers when the page loads and appears in browser tabs. It is also a primary SEO ranking factor.',
        beforeCode: '<head>\n  <meta charset="utf-8">\n</head>',
        afterCode: '<head>\n  <meta charset="utf-8">\n  <title>About Us - Company Name</title>\n</head>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#page-titled',
        seoImpact: 'The <title> tag is one of the top-3 SEO ranking signals.',
    },
    {
        ruleId: 'tabindex',
        title: 'Elements should not have tabindex greater than zero',
        explanation:
            'A positive tabindex disrupts the natural tab order, making keyboard navigation confusing and unpredictable.',
        beforeCode: '<button tabindex="5">Submit</button>',
        afterCode: '<button tabindex="0">Submit</button>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#focus-order',
    },

    // ========================================================================
    // UNDERSTANDABLE
    // ========================================================================
    {
        ruleId: 'html-has-lang',
        title: 'HTML element must have a lang attribute',
        explanation:
            'The lang attribute tells screen readers which language to use for pronunciation, and helps search engines determine the correct audience.',
        beforeCode: '<html>',
        afterCode: '<html lang="en">',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#language-of-page',
        seoImpact: 'The lang attribute helps Google serve pages in the correct language/region.',
    },
    {
        ruleId: 'html-lang-valid',
        title: 'HTML element must have a valid lang attribute value',
        explanation:
            'The lang value must be a valid BCP 47 language tag (e.g., "en", "es", "fr-CA").',
        beforeCode: '<html lang="english">',
        afterCode: '<html lang="en">',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#language-of-page',
    },
    {
        ruleId: 'valid-lang',
        title: 'lang attribute must have a valid value',
        explanation:
            'Elements with a lang attribute must use valid BCP 47 values so screen readers switch pronunciation correctly.',
        beforeCode: '<p lang="xyz">Bonjour</p>',
        afterCode: '<p lang="fr">Bonjour</p>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#language-of-parts',
    },
    {
        ruleId: 'autocomplete-valid',
        title: 'autocomplete attribute must be used correctly',
        explanation:
            'The autocomplete attribute on form fields must use valid tokens to help browsers and assistive technologies auto-fill forms for users with cognitive or motor disabilities.',
        beforeCode: '<input type="text" autocomplete="street">',
        afterCode: '<input type="text" autocomplete="street-address">',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#identify-input-purpose',
    },

    // ========================================================================
    // ROBUST
    // ========================================================================
    {
        ruleId: 'duplicate-id',
        title: 'id attribute must be unique',
        explanation:
            'Duplicate IDs break accessibility features like label associations and ARIA references. They also violate the HTML spec.',
        beforeCode: '<div id="content">...</div>\n<div id="content">...</div>',
        afterCode: '<div id="content-main">...</div>\n<div id="content-sidebar">...</div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#parsing',
        seoImpact: 'Duplicate IDs can cause parsing errors that affect how crawlers interpret page structure.',
    },
    {
        ruleId: 'duplicate-id-active',
        title: 'Active id attributes must be unique',
        explanation:
            'IDs used on focusable/active elements (buttons, links, inputs) must be unique or keyboard navigation and label associations will break.',
        beforeCode: '<button id="submit">Save</button>\n<button id="submit">Cancel</button>',
        afterCode: '<button id="submit-save">Save</button>\n<button id="submit-cancel">Cancel</button>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#parsing',
    },
    {
        ruleId: 'aria-allowed-attr',
        title: 'ARIA attributes must be allowed for the element role',
        explanation:
            'Using unsupported ARIA attributes on elements confuses assistive technologies.',
        beforeCode: '<div role="alert" aria-checked="true">Warning</div>',
        afterCode: '<div role="alert">Warning</div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-required-attr',
        title: 'Required ARIA attributes must be provided',
        explanation:
            'Certain ARIA roles require specific attributes to function correctly with assistive technologies.',
        beforeCode: '<div role="checkbox">Option</div>',
        afterCode: '<div role="checkbox" aria-checked="false">Option</div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-valid-attr-value',
        title: 'ARIA attributes must have valid values',
        explanation:
            'ARIA attribute values must conform to their allowed value types (e.g., true/false for boolean attributes, valid ID references).',
        beforeCode: '<div aria-hidden="yes">Hidden content</div>',
        afterCode: '<div aria-hidden="true">Hidden content</div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-roles',
        title: 'ARIA roles must be valid',
        explanation:
            'The role attribute must use values defined in the WAI-ARIA specification.',
        beforeCode: '<div role="navi">Menu</div>',
        afterCode: '<nav>Menu</nav>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'meta-viewport',
        title: 'Zooming and scaling must not be disabled',
        explanation:
            'The viewport meta tag must not set maximum-scale=1.0 or user-scalable=no, as this prevents users with low vision from zooming.',
        beforeCode: '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">',
        afterCode: '<meta name="viewport" content="width=device-width, initial-scale=1">',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#resize-text',
        seoImpact: 'The viewport meta tag is required for mobile-first indexing.',
    },
    {
        ruleId: 'region',
        title: 'All page content should be contained by landmarks',
        explanation:
            'Screen reader users rely on landmark regions (header, nav, main, footer) to navigate efficiently. All visible content should be inside a landmark.',
        beforeCode: '<body>\n  <div>Navigation</div>\n  <div>Content</div>\n</body>',
        afterCode: '<body>\n  <nav>Navigation</nav>\n  <main>Content</main>\n</body>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },
    {
        ruleId: 'landmark-one-main',
        title: 'Document should have one main landmark',
        explanation:
            'Every page should have exactly one <main> element or an element with role="main" to identify the primary content area.',
        beforeCode: '<body>\n  <div>Content</div>\n</body>',
        afterCode: '<body>\n  <main>Content</main>\n</body>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },
];

// Build a lookup map for O(1) access
const REMEDIATION_MAP = new Map<string, RemediationEntry>();
for (const entry of REMEDIATION_DB) {
    REMEDIATION_MAP.set(entry.ruleId, entry);
}

/**
 * Look up remediation guidance for a specific axe rule ID.
 * Returns the enhanced entry if available, or null to fall back to axe-core defaults.
 */
export function getRemediation(ruleId: string): RemediationEntry | null {
    return REMEDIATION_MAP.get(ruleId) || null;
}

/**
 * Get all available remediation entries.
 */
export function getAllRemediations(): RemediationEntry[] {
    return REMEDIATION_DB;
}
