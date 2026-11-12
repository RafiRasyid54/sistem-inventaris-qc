import type { NextConfig } from "next";
import path from "path";

// Kosong = aplikasi berada di root domain (mis. https://qc.workshop-up2w3.com).
// Isi NEXT_PUBLIC_BASE_PATH hanya bila dipasang di subfolder (mis. GitHub Pages).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hasil build berupa file statis (folder out) yang dilayani nginx di server
  output: "export",
  basePath,
  images: {
    unoptimized: true,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "node_modules")],
    silenceDeprecations: ["import", "global-builtin", "color-functions", "mixed-decls"],
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