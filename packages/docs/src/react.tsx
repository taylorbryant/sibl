import type { Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DocsConfig, DocsTheme } from "./config.js";
import { adjacentNavigationItems, pageHref } from "./navigation.js";
import type { DocsPageDescriptor } from "./server.js";
import { DocsLayout, type DocsLayoutProps } from "./shell.js";
import type { DocsThemeSettings } from "./theme.js";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function serializeInlineScriptValue(value: string): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export interface DocsThemeScriptProps {
  theme: DocsThemeSettings;
}

export function createDocsViewport(
  theme: Pick<DocsTheme, "background">,
): Viewport {
  return {
    themeColor: [
      {
        color: theme.background.light,
        media: "(prefers-color-scheme: light)",
      },
      {
        color: theme.background.dark,
        media: "(prefers-color-scheme: dark)",
      },
    ],
  };
}

export function DocsThemeScript({ theme }: DocsThemeScriptProps) {
  const darkColor = theme.background.dark;
  const lightColor = theme.background.light;
  const storageKey = theme.storageKey;
  const serializedStorageKey = serializeInlineScriptValue(storageKey);
  const serializedDarkColor = serializeInlineScriptValue(darkColor);
  const serializedLightColor = serializeInlineScriptValue(lightColor);
  const script = `(function(){try{var k=${serializedStorageKey};var t=localStorage.getItem(k);var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);var c=d?${serializedDarkColor}:${serializedLightColor};var m=document.querySelectorAll('meta[name="theme-color"]');if(!m.length){var n=document.createElement("meta");n.name="theme-color";document.head.appendChild(n);m=[n]}for(var i=0;i<m.length;i++)m[i].content=c}catch(e){}})()`;
  // biome-ignore lint/security/noDangerouslySetInnerHtml: The pre-hydration theme bootstrap contains only JSON-escaped config values and static code.
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export interface DocsArticleProps {
  children: ReactNode;
  className?: string;
}

export function DocsArticle({ children, className }: DocsArticleProps) {
  return (
    <article className={classNames("sibl-article", "sibl-prose", className)}>
      {children}
    </article>
  );
}

export interface DocsPageHeaderProps {
  page: DocsPageDescriptor;
}

export function DocsPageHeader({ page }: DocsPageHeaderProps) {
  return (
    <header className="sibl-page-header">
      {(page.eyebrow ?? page.section) ? (
        <p className="sibl-eyebrow">{page.eyebrow ?? page.section}</p>
      ) : null}
      <h1>{page.title}</h1>
      {page.description ? <p>{page.description}</p> : null}
    </header>
  );
}

export interface DocsPaginationProps {
  config: DocsConfig;
  currentSlug: string;
}

export function DocsPagination({ config, currentSlug }: DocsPaginationProps) {
  const adjacent = adjacentNavigationItems(config, currentSlug);
  if (!adjacent.previous && !adjacent.next) return null;

  return (
    <nav aria-label="Pagination" className="sibl-pagination">
      {adjacent.previous ? (
        <Link href={pageHref(config, adjacent.previous.slug)} rel="prev">
          <span>Previous</span>
          <strong>{adjacent.previous.title}</strong>
        </Link>
      ) : (
        <span className="sibl-pagination-spacer" />
      )}
      {adjacent.next ? (
        <Link
          className="sibl-pagination-next"
          href={pageHref(config, adjacent.next.slug)}
          rel="next"
        >
          <span>Next</span>
          <strong>{adjacent.next.title}</strong>
        </Link>
      ) : null}
    </nav>
  );
}

export interface DocsPageProps
  extends Omit<DocsLayoutProps, "children" | "currentSlug"> {
  children: ReactNode;
  page: DocsPageDescriptor;
}

export function DocsPage({ children, page, ...layoutProps }: DocsPageProps) {
  return (
    <DocsLayout {...layoutProps} currentSlug={page.slug}>
      <DocsArticle>
        {children}
        <DocsPagination config={layoutProps.config} currentSlug={page.slug} />
      </DocsArticle>
    </DocsLayout>
  );
}

export function DocsPageWithHeader({
  children,
  page,
  ...layoutProps
}: DocsPageProps) {
  return (
    <DocsLayout {...layoutProps} currentSlug={page.slug}>
      <DocsArticle>
        <DocsPageHeader page={page} />
        {children}
        <DocsPagination config={layoutProps.config} currentSlug={page.slug} />
      </DocsArticle>
    </DocsLayout>
  );
}

export { Callout, type CalloutProps } from "./callout.js";
export { SearchButton, type SearchButtonProps } from "./search-ui.js";
export {
  DocsLayout,
  type DocsLayoutProps,
  DocsNavigation,
  type DocsNavigationProps,
} from "./shell.js";
export {
  type DocsThemeSettings,
  type Theme,
  type ThemeColors,
  ThemeToggle,
  type ThemeToggleProps,
  useDocsTheme,
} from "./theme.js";
export {
  DocsTableOfContents,
  type DocsTableOfContentsProps,
} from "./toc.js";
