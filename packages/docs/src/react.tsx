import Link from "next/link";
import type { ReactNode } from "react";
import type { DocsConfig } from "./config.js";
import { adjacentNavigationItems, pageHref } from "./navigation.js";
import type { DocsPage as DocsPageData } from "./server.js";
import { DocsLayout, type DocsLayoutProps } from "./shell.js";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function DocsThemeScript({ storageKey }: { storageKey: string }) {
  const serializedStorageKey = JSON.stringify(storageKey).replaceAll(
    "<",
    "\\u003c",
  );
  const script = `(function(){try{var k=${serializedStorageKey};var t=localStorage.getItem(k);var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
  // biome-ignore lint/security/noDangerouslySetInnerHtml: The pre-hydration theme bootstrap contains only a JSON-escaped storage key and static code.
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

export function DocsPageHeader({ page }: { page: DocsPageData }) {
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
  page: DocsPageData;
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
export { type Theme, ThemeToggle, useDocsTheme } from "./theme.js";
export { DocsTableOfContents } from "./toc.js";
