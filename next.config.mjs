/** @type {import('next').NextConfig} */
// Config rebuild marker: 2026-05-11T14:05 (force webpack manifest regen)
// Tocar este archivo fuerza un restart completo del dev server, lo que
// regenera el manifest de webpack y resuelve errores de modulo factory
// undefined ("Cannot read properties of undefined (reading 'call')") que
// ocurren cuando el HMR acumula chunks obsoletos tras multiples rebuilds.
const nextConfig = {
  // NOTA: NO usar `output: 'standalone'` en Vercel.
  // Standalone es para self-hosting (Docker). En Vercel rompe la generacion
  // de assets dinamicos como opengraph-image.tsx (devuelven HTML vacio
  // 200 en vez del PNG). Vercel ya optimiza el bundle automaticamente.

  reactStrictMode: true,
  trailingSlash: false,

  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  async redirects() {
    return [
      // Página de upgrade antigua → nueva sección de membresías en home.
      // Source exacto (sin comodín) para NO afectar las landings SEO
      // /membership/upgrade/petite, /essentiel, /signature, /prive.
      {
        source: '/membership/upgrade',
        destination: '/#membresias',
        permanent: true,
      },

      // www → non-www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.semzoprive.com',
          },
        ],
        destination: 'https://semzoprive.com/:path*',
        permanent: true,
      },

      // Force HTTPS
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://semzoprive.com/:path*',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        // Block specific logo from Google Images indexing
        source: '/images/logo-20semzo-20prive.png',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, noimageindex',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      {
        source: '/:path*',
        headers: [
          // Security
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
              "script-src * 'unsafe-inline' 'unsafe-eval'",
              "style-src * 'unsafe-inline'",
              "img-src * data: blob:",
              "font-src * data:",
              "connect-src * wss: ws:",
              "frame-src * data: blob: https://verify.stripe.com https://js.stripe.com https://*.stripe.com",
              "object-src 'none'",
            ].join('; ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },

          // SEO hardening
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ]
      }
    ]
  },

  async rewrites() {
    return [
      {
        source: '/rss.xml',
        destination: '/api/rss',
      },
      {
        source: '/rss-pinterest.xml',
        destination: '/api/rss-pinterest',
      },
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: 'https', hostname: 'misc.stripe.com', pathname: '/stripe-copy-assets/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'source.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.com' },
      { protocol: 'https', hostname: '**.v0.dev' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '**.vusercontent.net' },
      { protocol: 'https', hostname: '**.vercel.app' },
    ],
  },
};

export default nextConfig;
