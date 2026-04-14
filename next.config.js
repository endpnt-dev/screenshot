/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@sparticuz/chromium',
      'playwright-core'
    ]
  },
  images: {
    domains: []
  },
  outputFileTracingIncludes: {
    '/api/v1/capture': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-side dependencies on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'playwright-core': false,
        '@sparticuz/chromium': false,
        fs: false,
        path: false,
      }
    }
    return config
  }
}

module.exports = nextConfig