import { createMdxComponents } from "@sibl/docs/mdx";
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createMdxComponents(components);
}
