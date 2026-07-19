import type { MDXComponents } from "mdx/types";
import { createMdxComponents } from "@sibl/docs/mdx";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createMdxComponents(components);
}
