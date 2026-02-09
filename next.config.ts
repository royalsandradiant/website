import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  serverExternalPackages: ["@prisma/client", "sharp"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
