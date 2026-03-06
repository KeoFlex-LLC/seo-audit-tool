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

    // ========================================================================
    // EXPANDED — Perceivable (Additional)
    // ========================================================================
    {
        ruleId: 'empty-heading',
        title: 'Headings must not be empty',
        explanation: 'Empty headings are confusing for screen reader users who rely on headings to navigate. They also send weak content signals to search engines.',
        beforeCode: '<h2></h2>\n<h2> </h2>',
        afterCode: '<h2>Our Services</h2>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
        seoImpact: 'Empty headings waste crawl budget and weaken your heading structure.',
    },
    {
        ruleId: 'page-has-heading-one',
        title: 'Page should contain a level-one heading',
        explanation: 'Every page needs an <h1> that describes its main topic. This is the first thing screen readers announce in heading navigation mode.',
        beforeCode: '<body>\n  <h2>About Us</h2>\n  <p>Content here.</p>\n</body>',
        afterCode: '<body>\n  <h1>About Us</h1>\n  <p>Content here.</p>\n</body>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
        seoImpact: 'H1 is a primary content signal for search engines.',
    },
    {
        ruleId: 'frame-title',
        title: 'Frames must have a title attribute',
        explanation: 'Screen reader users need a title on <iframe> elements to understand what embedded content they contain before deciding to navigate into it.',
        beforeCode: '<iframe src="https://maps.google.com/embed"></iframe>',
        afterCode: '<iframe src="https://maps.google.com/embed" title="Google Maps showing our office location"></iframe>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#bypass-blocks',
        seoImpact: 'Titled iframes help crawlers understand embedded content.',
    },
    {
        ruleId: 'svg-img-alt',
        title: 'SVG elements with an img role must have descriptive text',
        explanation: 'SVGs used as images (role="img") must have a <title> element or aria-label so screen readers can describe them.',
        beforeCode: '<svg role="img"><path d="..."/></svg>',
        afterCode: '<svg role="img" aria-label="Company logo"><path d="..."/></svg>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#non-text-content',
    },
    {
        ruleId: 'object-alt',
        title: 'Object elements must have alternate text',
        explanation: 'Embedded <object> elements need alternative content for users who cant see or interact with the embedded object.',
        beforeCode: '<object data="chart.swf" type="application/x-shockwave-flash"></object>',
        afterCode: '<object data="chart.swf" type="application/x-shockwave-flash">\n  <p>Quarterly revenue chart showing 15% growth</p>\n</object>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#non-text-content',
    },
    {
        ruleId: 'role-img-alt',
        title: 'Elements with role="img" must have an accessible name',
        explanation: 'When role="img" is applied to a non-image element, it must have an aria-label or aria-labelledby to describe the visual content.',
        beforeCode: '<div role="img" style="background-image: url(hero.jpg)"></div>',
        afterCode: '<div role="img" aria-label="Sunset over the mountains" style="background-image: url(hero.jpg)"></div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#non-text-content',
    },

    // ========================================================================
    // EXPANDED — Lists & Tables
    // ========================================================================
    {
        ruleId: 'list',
        title: 'Lists must be structured correctly',
        explanation: '<ul> and <ol> elements must only contain <li>, <script>, or <template> elements. Incorrect children break screen reader list navigation.',
        beforeCode: '<ul>\n  <div>Item 1</div>\n  <div>Item 2</div>\n</ul>',
        afterCode: '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
        seoImpact: 'Proper list markup helps search engines extract structured data.',
    },
    {
        ruleId: 'listitem',
        title: 'List items must be contained in a list',
        explanation: '<li> elements must be children of <ul>, <ol>, or role="list" elements.',
        beforeCode: '<div>\n  <li>Orphan item</li>\n</div>',
        afterCode: '<ul>\n  <li>Proper item</li>\n</ul>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
        seoImpact: 'Proper list markup helps search engines extract structured data.',
    },
    {
        ruleId: 'definition-list',
        title: 'Definition lists must be structured correctly',
        explanation: '<dl> elements must only contain <dt>, <dd>, <div>, <script>, or <template> groups.',
        beforeCode: '<dl>\n  <p>Term</p>\n  <p>Definition</p>\n</dl>',
        afterCode: '<dl>\n  <dt>Term</dt>\n  <dd>Definition of the term</dd>\n</dl>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },
    {
        ruleId: 'dlitem',
        title: 'Definition list items must be wrapped in dl',
        explanation: '<dt> and <dd> elements must be contained within a <dl> element.',
        beforeCode: '<div>\n  <dt>Term</dt>\n  <dd>Definition</dd>\n</div>',
        afterCode: '<dl>\n  <dt>Term</dt>\n  <dd>Definition</dd>\n</dl>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },
    {
        ruleId: 'td-has-header',
        title: 'Data cells must reference header cells',
        explanation: 'In complex tables, each <td> must be associated with a <th> via headers attribute or proper scope, so screen readers can announce column/row context.',
        beforeCode: '<table>\n  <tr><td>Sales</td><td>$100</td></tr>\n</table>',
        afterCode: '<table>\n  <tr><th scope="col">Category</th><th scope="col">Amount</th></tr>\n  <tr><td>Sales</td><td>$100</td></tr>\n</table>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
        seoImpact: 'Table headers help crawlers understand tabular data relationships.',
    },
    {
        ruleId: 'th-has-data-cells',
        title: 'Table headers must be associated with data cells',
        explanation: '<th> elements must have corresponding <td> cells in the same row or column.',
        beforeCode: '<table>\n  <tr><th>Name</th></tr>\n</table>',
        afterCode: '<table>\n  <tr><th>Name</th></tr>\n  <tr><td>John Doe</td></tr>\n</table>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
        seoImpact: 'Table headers help crawlers understand tabular data relationships.',
    },
    {
        ruleId: 'scope-attr-valid',
        title: 'scope attribute must be used correctly',
        explanation: 'The scope attribute on <th> elements must be "row", "col", "rowgroup", or "colgroup".',
        beforeCode: '<th scope="data">Name</th>',
        afterCode: '<th scope="col">Name</th>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },
    {
        ruleId: 'empty-table-header',
        title: 'Table header elements must not be empty',
        explanation: 'Empty <th> elements provide no context for screen reader users navigating table data.',
        beforeCode: '<table>\n  <tr><th></th><th>Price</th></tr>\n</table>',
        afterCode: '<table>\n  <tr><th>Product</th><th>Price</th></tr>\n</table>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },

    // ========================================================================
    // EXPANDED — ARIA Patterns
    // ========================================================================
    {
        ruleId: 'aria-hidden-focus',
        title: 'aria-hidden elements must not contain focusable elements',
        explanation: 'When aria-hidden="true" is set, all child elements are hidden from screen readers. But if they are focusable, keyboard users will reach invisible elements.',
        beforeCode: '<div aria-hidden="true">\n  <button>Click me</button>\n</div>',
        afterCode: '<div aria-hidden="true">\n  <button tabindex="-1">Click me</button>\n</div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-input-field-name',
        title: 'ARIA input fields must have an accessible name',
        explanation: 'Elements with ARIA input roles (textbox, combobox, searchbox, spinbutton, slider) must have an accessible name.',
        beforeCode: '<div role="textbox" contenteditable="true"></div>',
        afterCode: '<div role="textbox" contenteditable="true" aria-label="Message body"></div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-toggle-field-name',
        title: 'ARIA toggle fields must have an accessible name',
        explanation: 'Elements with toggle roles (checkbox, switch, menuitemcheckbox, menuitemradio) must have a label.',
        beforeCode: '<div role="switch"></div>',
        afterCode: '<div role="switch" aria-label="Dark mode"></div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-command-name',
        title: 'ARIA command elements must have an accessible name',
        explanation: 'Elements with roles like button, link, or menuitem must have an accessible name from text content, aria-label, or aria-labelledby.',
        beforeCode: '<span role="button"><svg>...</svg></span>',
        afterCode: '<span role="button" aria-label="Close dialog"><svg>...</svg></span>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-meter-name',
        title: 'ARIA meter elements must have an accessible name',
        explanation: 'Elements with role="meter" must have a label describing what is being measured.',
        beforeCode: '<div role="meter" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>',
        afterCode: '<div role="meter" aria-label="Storage usage" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-progressbar-name',
        title: 'ARIA progressbar elements must have an accessible name',
        explanation: 'Elements with role="progressbar" must have a label describing what progress is being tracked.',
        beforeCode: '<div role="progressbar" aria-valuenow="50"></div>',
        afterCode: '<div role="progressbar" aria-label="File upload progress" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-required-children',
        title: 'ARIA parent roles must contain required child roles',
        explanation: 'Some ARIA roles require specific child roles (e.g., role="list" requires role="listitem" children).',
        beforeCode: '<div role="list">\n  <div>Item</div>\n</div>',
        afterCode: '<div role="list">\n  <div role="listitem">Item</div>\n</div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-required-parent',
        title: 'ARIA child roles must be contained by parent roles',
        explanation: 'Some ARIA roles must be contained within specific parent roles (e.g., role="listitem" must be inside role="list").',
        beforeCode: '<div>\n  <div role="listitem">Item</div>\n</div>',
        afterCode: '<div role="list">\n  <div role="listitem">Item</div>\n</div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-valid-attr',
        title: 'ARIA attributes must be valid',
        explanation: 'Attribute names beginning with "aria-" must correspond to real ARIA attributes defined in the WAI-ARIA specification.',
        beforeCode: '<div aria-description="Info">Content</div>',
        afterCode: '<div aria-describedby="info-text">Content</div>\n<span id="info-text" class="sr-only">Additional information</span>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },

    // ========================================================================
    // EXPANDED — Forms & Interactive
    // ========================================================================
    {
        ruleId: 'select-name',
        title: 'Select elements must have an accessible name',
        explanation: 'Every <select> element needs an associated <label> or aria-label so screen readers can announce the dropdown purpose.',
        beforeCode: '<select>\n  <option>Option 1</option>\n</select>',
        afterCode: '<label for="state">State</label>\n<select id="state">\n  <option>Texas</option>\n</select>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#labels-or-instructions',
    },
    {
        ruleId: 'form-field-multiple-labels',
        title: 'Form fields should not have multiple labels',
        explanation: 'Multiple labels on the same input cause confusion for screen readers. Each form field should have exactly one label.',
        beforeCode: '<label for="name">Name</label>\n<label for="name">Full Name</label>\n<input id="name">',
        afterCode: '<label for="name">Full Name</label>\n<input id="name">',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#labels-or-instructions',
    },
    {
        ruleId: 'nested-interactive',
        title: 'Interactive elements must not be nested',
        explanation: 'Nesting focusable elements (e.g., a button inside a link) causes unpredictable behavior for keyboard and screen reader users.',
        beforeCode: '<a href="/page">\n  <button>Click here</button>\n</a>',
        afterCode: '<a href="/page">Click here</a>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'target-size',
        title: 'Touch targets must be large enough',
        explanation: 'Interactive elements must have a minimum target size of 24×24 CSS pixels (44×44 recommended) for users with motor impairments.',
        beforeCode: '<a href="/link" style="padding: 2px; font-size: 10px;">Link</a>',
        afterCode: '<a href="/link" style="padding: 12px; font-size: 14px; min-height: 44px; min-width: 44px;">Link</a>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#target-size',
    },

    // ========================================================================
    // EXPANDED — Landmark & Navigation
    // ========================================================================
    {
        ruleId: 'landmark-unique',
        title: 'Landmarks should have unique labels',
        explanation: 'When multiple landmarks of the same type exist (e.g., two <nav>), each must have a unique aria-label to distinguish them.',
        beforeCode: '<nav>Main Menu</nav>\n<nav>Footer Menu</nav>',
        afterCode: '<nav aria-label="Main">Main Menu</nav>\n<nav aria-label="Footer">Footer Menu</nav>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },
    {
        ruleId: 'landmark-no-duplicate-banner',
        title: 'Document should not have more than one banner landmark',
        explanation: 'Only one <header> or role="banner" should exist at the top level. Multiple banners confuse screen reader landmark navigation.',
        beforeCode: '<header>Site Header</header>\n<header>Another Header</header>',
        afterCode: '<header>Site Header</header>\n<div class="sub-header">Sub Header</div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },
    {
        ruleId: 'landmark-no-duplicate-contentinfo',
        title: 'Document should not have more than one contentinfo landmark',
        explanation: 'Only one <footer> or role="contentinfo" should exist at the top level.',
        beforeCode: '<footer>Footer 1</footer>\n<footer>Footer 2</footer>',
        afterCode: '<footer>\n  <div>Footer Section 1</div>\n  <div>Footer Section 2</div>\n</footer>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },
    {
        ruleId: 'landmark-banner-is-top-level',
        title: 'Banner landmark must be top level',
        explanation: 'The <header> element (role="banner") must not be nested inside other landmarks like <main> or <aside>.',
        beforeCode: '<main>\n  <header>Page Header</header>\n</main>',
        afterCode: '<header>Site Header</header>\n<main>Content</main>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },
    {
        ruleId: 'landmark-contentinfo-is-top-level',
        title: 'Contentinfo landmark must be top level',
        explanation: 'The <footer> element (role="contentinfo") must not be nested inside other landmarks.',
        beforeCode: '<main>\n  <footer>© 2024</footer>\n</main>',
        afterCode: '<main>Content</main>\n<footer>© 2024</footer>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#info-and-relationships',
    },
    {
        ruleId: 'focus-order-semantics',
        title: 'Elements in the focus order need an appropriate role',
        explanation: 'Elements that receive keyboard focus should have ARIA roles matching their behavior so screen readers announce them correctly.',
        beforeCode: '<span tabindex="0" onclick="toggle()">Settings</span>',
        afterCode: '<button onclick="toggle()">Settings</button>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
    },
    {
        ruleId: 'aria-tooltip-name',
        title: 'ARIA tooltip elements must have an accessible name',
        explanation: 'Elements with role="tooltip" must have text content or an aria-label.',
        beforeCode: '<div role="tooltip"></div>',
        afterCode: '<div role="tooltip">Click to copy</div>',
        wcagLink: 'https://www.w3.org/TR/WCAG21/#name-role-value',
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
