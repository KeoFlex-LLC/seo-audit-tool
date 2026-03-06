import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize Playwright + Chromium from webpack bundling
  // These must be loaded at runtime, not bundled into serverless functions
  serverExternalPackages: [
    'puppeteer-core',
    '@sparticuz/chromium-min',
    'axe-core',
  ],
};

export default nextConfig;
