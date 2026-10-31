const { withSentryConfig } = require('@sentry/nextjs/config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@codesync/ui", "@codesync/shared-types"],
  experimental: {
    serverComponentsExternalPackages: ["bullmq", "ioredis"],
  },
};

module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(
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
    )
  : nextConfig;
