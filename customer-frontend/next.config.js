/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.pexels.com', 'images.unsplash.com', 'localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.payhere.lk https://sandbox.payhere.lk https://www.google-analytics.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maxcdn.bootstrapcdn.com https://sandbox.payhere.lk https://www.payhere.lk",
              "img-src 'self' data: https: https://images.pexels.com https://images.unsplash.com https://sandbox.payhere.lk https://www.payhere.lk",
              "font-src 'self' https://fonts.gstatic.com https://maxcdn.bootstrapcdn.com",
              // ✅ FIXED: Clearly added localhost API URL here
              "connect-src 'self' http://localhost:3001 https://sandbox.payhere.lk https://www.payhere.lk https://api.payhere.lk",
              "frame-src 'self' https://sandbox.payhere.lk https://www.payhere.lk",
              "form-action 'self' https://sandbox.payhere.lk https://www.payhere.lk"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig;
