import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@met4citizen/talkinghead"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
