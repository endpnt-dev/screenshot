/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@sparticuz/chromium-min',
      'playwright-core'
    ]
  },
  images: {
    domains: []
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-side dependencies on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'playwright-core': false,
        '@sparticuz/chromium-min': false,
        fs: false,
        path: false,
      }
    }
    return config
  }
}

module.exports = nextConfig