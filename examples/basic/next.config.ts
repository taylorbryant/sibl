import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./content/docs/**/*.md"],
  },
  serverExternalPackages: ["siglum"],
};

export default nextConfig;
