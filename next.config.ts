import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize Playwright + Chromium from webpack bundling
  // These must be loaded at runtime, not bundled into serverless functions
  serverExternalPackages: [
    'playwright-core',
    '@sparticuz/chromium',
    '@axe-core/playwright',
  ],
};

export default nextConfig;
