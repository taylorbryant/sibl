import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { createMdxOptions } from "sibl/mdx-config";

const withMDX = createMDX({
  options: createMdxOptions(),
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  serverExternalPackages: ["sibl"],
};

export default withMDX(nextConfig);
