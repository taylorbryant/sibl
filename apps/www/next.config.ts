import createMDX from "@next/mdx";
import { createMdxOptions } from "@sibl/docs/mdx-config";
import type { NextConfig } from "next";

const withMDX = createMDX({
  options: createMdxOptions(),
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  serverExternalPackages: ["@sibl/docs"],
};

export default withMDX(nextConfig);
