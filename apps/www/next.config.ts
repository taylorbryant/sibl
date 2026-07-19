import createMDX from "@next/mdx";
import { createMdxOptions } from "@sibl/docs/mdx-config";
import type { NextConfig } from "next";

const withMDX = createMDX({
  options: createMdxOptions(),
});

const deploymentBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
  /\/+$/,
  "",
);

const nextConfig: NextConfig = {
  basePath: deploymentBasePath || undefined,
  output: process.env.SIBL_STATIC_EXPORT === "1" ? "export" : undefined,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  serverExternalPackages: ["@sibl/docs"],
};

export default withMDX(nextConfig);
