import type { MDXComponents } from "mdx/types";
import { createMdxComponents } from "siglum/mdx";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createMdxComponents(components);
}
