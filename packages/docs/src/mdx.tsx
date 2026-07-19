import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import {
  type ComponentPropsWithoutRef,
  isValidElement,
  type ReactNode,
} from "react";
import { Callout } from "./callout.js";
import { CopyButton } from "./copy-button.js";

function codeLanguage(children: ReactNode): string | undefined {
  if (!isValidElement<{ className?: string }>(children)) return undefined;
  return children.props.className?.match(/language-(\S+)/)?.[1];
}

function HeadingAnchor({
  as: Element,
  children,
  id,
  ...props
}: ComponentPropsWithoutRef<"h2"> & { as: "h2" | "h3" }) {
  return (
    <Element id={id} {...props}>
      {id ? (
        <a
          aria-label={`Link to ${typeof children === "string" ? children : "section"}`}
          className="sibl-heading-anchor"
          href={`#${id}`}
        >
          {children}
        </a>
      ) : (
        children
      )}
    </Element>
  );
}

export function createMdxComponents(
  components: MDXComponents = {},
): MDXComponents {
  return {
    Callout,
    h1: (props) => <h1 {...props} />,
    h2: (props) => <HeadingAnchor as="h2" {...props} />,
    h3: (props) => <HeadingAnchor as="h3" {...props} />,
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
          <div className="sibl-code-actions">
            {language ? <span>{language}</span> : null}
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
    img: ({ alt = "", ...props }) => (
      // biome-ignore lint/performance/noImgElement: Generic MDX images do not necessarily provide the dimensions or loader required by next/image.
      <img alt={alt} {...props} />
    ),
    ...components,
  };
}

export type { MDXComponents } from "mdx/types";
export { Callout, type CalloutProps } from "./callout.js";
