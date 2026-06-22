import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  allowedDevOrigins: ["designate-tidiness-stifle.ngrok-free.dev"],
};

export default nextConfig;
