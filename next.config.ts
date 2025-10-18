import type { NextConfig } from 'next';

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
                hostname: 'picsum.photos',
                port: '',
                pathname: '/**',
            },
        ],
    },
    env: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || (
            process.env.NODE_ENV === 'production'
                ? 'https://on-ngan-hang.vercel.app' // Fallback for production
                : 'http://localhost:9002' // Fallback for local development
        ),
    }
};

export default nextConfig;
