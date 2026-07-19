import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { createMdxOptions } from "@sibl/docs/mdx-config";

const withMDX = createMDX({
  options: createMdxOptions(),
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  serverExternalPackages: ["@sibl/docs"],
};

export default withMDX(nextConfig);
