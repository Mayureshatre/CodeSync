const { withSentryConfig } = require('@sentry/nextjs/config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@codesync/ui"],
};

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "codesync",
    project: "codesync-web",
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    hideSourceMaps: true,
    disableLogger: true,
  }
);
