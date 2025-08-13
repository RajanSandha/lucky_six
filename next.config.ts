import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
  serverActions: {
    bodySizeLimit: '4mb', // Increase body size limit for file uploads
    maxDuration: 120, // Increase timeout to 2 minutes
  },
  env: {
      NEXT_PUBLIC_VAPID_KEY: 'BBr_jRbrT7Yg_s_4dftCIMnKN4yW6-d62fJ4n9XyJ8gX_r3n6t2Zz-Y4k6gX6qC8k1v9h3bZ2yS_x6cG6jQ2mXw'
  }
};

export default nextConfig;
