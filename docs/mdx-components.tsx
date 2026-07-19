import type { MDXComponents } from "mdx/types";
import { createMdxComponents } from "@taylorbryant/sibl/mdx";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createMdxComponents(components);
}
