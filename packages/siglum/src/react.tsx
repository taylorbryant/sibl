import {
  Fragment,
  createElement,
  isValidElement,
  type CSSProperties,
  type ReactNode,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocsConfig, NavigationSection } from "./config.js";
import { slugifyHeading } from "./markdown.js";
import { adjacentNavigationItems, pageHref } from "./navigation.js";
import type { DocsPage } from "./server.js";

export interface DocsPageViewProps {
  config: DocsConfig;
  page: DocsPage;
}

function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeText(node.props.children);
  }
  return "";
}

function navigationList(
  config: DocsConfig,
  navigation: NavigationSection[],
  currentSlug: string,
) {
  return navigation.map((section) => (
    <section className="siglum-nav-section" key={section.label}>
      <p className="siglum-nav-label">{section.label}</p>
      <ul className="siglum-nav-list">
        {section.items.map((item) => {
          const active = item.slug === currentSlug;
          return (
            <li key={item.slug || "index"}>
              <a
                aria-current={active ? "page" : undefined}
                className="siglum-nav-link"
                data-active={active || undefined}
                href={pageHref(config, item.slug)}
              >
                <span>{item.title}</span>
                {item.badge ? (
                  <span className="siglum-badge">{item.badge}</span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  ));
}

function markdownComponents(): Components {
  const seenHeadings = new Map<string, number>();

  const heading = (depth: 2 | 3) =>
    function MarkdownHeading({ children }: { children?: ReactNode }) {
      const text = nodeText(children);
      const baseId = slugifyHeading(text) || "section";
      const occurrence = seenHeadings.get(baseId) ?? 0;
      seenHeadings.set(baseId, occurrence + 1);
      const id = occurrence === 0 ? baseId : `${baseId}-${occurrence + 1}`;

      return createElement(
        `h${depth}`,
        { id },
        <a aria-label={`Link to ${text}`} className="siglum-heading-anchor" href={`#${id}`}>
          {children}
        </a>,
      );
    };

  return {
    a({ children, href, ...props }) {
      const external = href?.startsWith("http");
      return (
        <a
          {...props}
          href={href}
          rel={external ? "noreferrer" : undefined}
          target={external ? "_blank" : undefined}
        >
          {children}
        </a>
      );
    },
    code({ children, className, ...props }) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    h2: heading(2),
    h3: heading(3),
  };
}

export function DocsPageView({ config, page }: DocsPageViewProps) {
  const adjacent = adjacentNavigationItems(config, page.slug);
  const style = {
    "--siglum-accent": config.theme.accent,
  } as CSSProperties;

  return (
    <div className="siglum-root" style={style}>
      <header className="siglum-header">
        <div className="siglum-header-inner">
          <a className="siglum-brand" href={config.basePath}>
            <span aria-hidden="true" className="siglum-mark">
              {config.theme.mark}
            </span>
            <span>{config.title}</span>
          </a>
          {config.links.length > 0 ? (
            <nav aria-label="Project" className="siglum-project-links">
              {config.links.map((link) => (
                <a href={link.href} key={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <div className="siglum-mobile-nav">
        <details>
          <summary>Browse documentation</summary>
          <nav aria-label="Documentation">
            {navigationList(config, config.navigation, page.slug)}
          </nav>
        </details>
      </div>

      <div className="siglum-grid">
        <aside className="siglum-sidebar">
          <nav aria-label="Documentation">
            {navigationList(config, config.navigation, page.slug)}
          </nav>
        </aside>

        <main className="siglum-main">
          <article className="siglum-article">
            <header className="siglum-page-header">
              <p className="siglum-eyebrow">{page.eyebrow ?? page.section}</p>
              <h1>{page.title}</h1>
              {page.description ? <p>{page.description}</p> : null}
            </header>

            <div className="siglum-prose">
              <ReactMarkdown
                components={markdownComponents()}
                remarkPlugins={[remarkGfm]}
              >
                {page.body}
              </ReactMarkdown>
            </div>

            <nav aria-label="Pagination" className="siglum-pagination">
              {adjacent.previous ? (
                <a href={pageHref(config, adjacent.previous.slug)} rel="prev">
                  <span>Previous</span>
                  <strong>{adjacent.previous.title}</strong>
                </a>
              ) : (
                <span />
              )}
              {adjacent.next ? (
                <a
                  className="siglum-pagination-next"
                  href={pageHref(config, adjacent.next.slug)}
                  rel="next"
                >
                  <span>Next</span>
                  <strong>{adjacent.next.title}</strong>
                </a>
              ) : null}
            </nav>
          </article>
        </main>

        <aside className="siglum-toc">
          {page.headings.length > 0 ? (
            <Fragment>
              <p>On this page</p>
              <ol>
                {page.headings.map((heading) => (
                  <li data-depth={heading.depth} key={heading.id}>
                    <a href={`#${heading.id}`}>{heading.text}</a>
                  </li>
                ))}
              </ol>
            </Fragment>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
