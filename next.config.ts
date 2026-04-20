import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone', // Removed for dev mode - not needed, causes hydration issues with remote access
  allowedDevOrigins: ['http://localhost:3002', 'http://192.168.31.90:3001'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
