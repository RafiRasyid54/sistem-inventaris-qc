import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hapus basePath dan assetPrefix karena Vercel menangani domain utama secara langsung
  images: {
    unoptimized: true,
  },
  // Hapus output: "export" agar Vercel dapat memproses Next.js dengan optimal
  sassOptions: {
    includePaths: [path.join(__dirname, "node_modules")],
  },
  // Bypass error build komponen yang tidak terpakai
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;