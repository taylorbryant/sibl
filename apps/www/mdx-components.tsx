import { createMdxComponents } from "@sibl/docs/mdx";
import type { MDXComponents } from "mdx/types";
import config from "@/sibl.config";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createMdxComponents(components, { config });
}
