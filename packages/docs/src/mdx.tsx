import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import {
  type ComponentPropsWithoutRef,
  isValidElement,
  type ReactNode,
} from "react";
import { Callout } from "./callout.js";
import type { DocsConfig } from "./config.js";
import { CopyButton } from "./copy-button.js";
import { publicHref } from "./navigation.js";

const codeLanguageLabels: Record<string, string> = {
  bash: "Shell",
  css: "CSS",
  go: "Go",
  html: "HTML",
  js: "JavaScript",
  json: "JSON",
  jsx: "JavaScript",
  md: "Markdown",
  mdx: "MDX",
  py: "Python",
  python: "Python",
  rs: "Rust",
  rust: "Rust",
  sh: "Shell",
  sql: "SQL",
  plaintext: "Text",
  text: "Text",
  txt: "Text",
  ts: "TypeScript",
  tsx: "TypeScript",
  yaml: "YAML",
  yml: "YAML",
};

function codeLanguage(children: ReactNode): string | undefined {
  if (!isValidElement<{ className?: string }>(children)) return undefined;
  return children.props.className?.match(/language-(\S+)/)?.[1];
}

function codeLanguageLabel(language: string): string {
  return codeLanguageLabels[language.toLowerCase()] ?? language;
}

function HeadingWithPermalink({
  as: Element,
  children,
  id,
  ...props
}: ComponentPropsWithoutRef<"h2"> & { as: "h2" | "h3" }) {
  return (
    <Element id={id} {...props}>
      {children}
      {id ? (
        // biome-ignore lint/a11y/useAnchorContent: CSS supplies the visible glyph and aria-label supplies the accessible name without changing heading textContent.
        <a
          aria-label={`Link to ${typeof children === "string" ? children : "section"}`}
          className="sibl-heading-permalink"
          href={`#${id}`}
        />
      ) : null}
    </Element>
  );
}

export interface CreateMdxComponentsOptions {
  config?: Pick<DocsConfig, "deploymentBasePath">;
}

export function createMdxComponents(
  components: MDXComponents = {},
  options: CreateMdxComponentsOptions = {},
): MDXComponents {
  return {
    Callout,
    h1: (props) => <h1 {...props} />,
    h2: (props) => <HeadingWithPermalink as="h2" {...props} />,
    h3: (props) => <HeadingWithPermalink as="h3" {...props} />,
    a: ({ children, href = "", ...props }) => {
      if (href.startsWith("/")) {
        return (
          <Link href={href} {...props}>
            {children}
          </Link>
        );
      }
      const external = href.startsWith("http");
      return (
        <a
          href={href}
          rel={external ? "noreferrer" : undefined}
          target={external ? "_blank" : undefined}
          {...props}
        >
          {children}
        </a>
      );
    },
    pre: ({ children, ...props }) => {
      const language = codeLanguage(children);
      return (
        <div className="sibl-code-block" data-sibl-code-block>
          <div className="sibl-code-actions" style={props.style}>
            {language ? <span>{codeLanguageLabel(language)}</span> : null}
            <CopyButton />
          </div>
          <pre {...props}>{children}</pre>
        </div>
      );
    },
    table: ({ children, ...props }) => (
      <div className="sibl-table-scroll">
        <table {...props}>{children}</table>
      </div>
    ),
    img: ({ alt = "", src, ...props }) => {
      const resolvedSource =
        typeof src === "string" && options.config
          ? publicHref(options.config, src)
          : src;
      return (
        // biome-ignore lint/performance/noImgElement: Generic MDX images do not necessarily provide the dimensions or loader required by next/image.
        <img alt={alt} src={resolvedSource} {...props} />
      );
    },
    ...components,
  };
}

export type { MDXComponents } from "mdx/types";
export { Callout, type CalloutProps } from "./callout.js";
