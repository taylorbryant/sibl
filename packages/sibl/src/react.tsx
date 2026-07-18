import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { DocsConfig, NavigationSection } from "./config.js";
import { adjacentNavigationItems, pageHref } from "./navigation.js";
import { SearchButton } from "./search-ui.js";
import type { DocsPage as DocsPageData } from "./server.js";
import { ThemeToggle } from "./theme.js";
import { DocsTableOfContents } from "./toc.js";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function DocsThemeScript({ storageKey }: { storageKey: string }) {
  const script = `(function(){try{var k=${JSON.stringify(storageKey)};var t=localStorage.getItem(k);var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function NavigationSections({
  config,
  currentSlug,
  navigation,
}: {
  config: DocsConfig;
  currentSlug: string;
  navigation: NavigationSection[];
}) {
  return navigation.map((section) => (
    <section className="sibl-nav-section" key={section.label}>
      <p className="sibl-nav-label">{section.label}</p>
      <ul className="sibl-nav-list">
        {section.items.map((item) => {
          const active = item.slug === currentSlug;
          return (
            <li key={item.slug || "index"}>
              <Link
                aria-current={active ? "page" : undefined}
                className="sibl-nav-link"
                data-active={active || undefined}
                href={pageHref(config, item.slug)}
              >
                <span>{item.navLabel ?? item.title}</span>
                {item.badge ? (
                  <span className="sibl-badge">{item.badge}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  ));
}

export interface DocsNavigationProps {
  config: DocsConfig;
  currentSlug: string;
  label?: string;
}

export function DocsNavigation({
  config,
  currentSlug,
  label = "Documentation",
}: DocsNavigationProps) {
  return (
    <nav aria-label={label}>
      <NavigationSections
        config={config}
        currentSlug={currentSlug}
        navigation={config.navigation}
      />
    </nav>
  );
}

export interface DocsLayoutProps {
  brand?: ReactNode;
  children: ReactNode;
  className?: string;
  config: DocsConfig;
  currentSlug: string;
  footer?: ReactNode;
  headerActions?: ReactNode;
  showSearch?: boolean;
  showTableOfContents?: boolean;
  showThemeToggle?: boolean;
  sidebarFooter?: ReactNode;
}

export function DocsLayout({
  brand,
  children,
  className,
  config,
  currentSlug,
  footer,
  headerActions,
  showSearch = config.search.enabled,
  showTableOfContents = true,
  showThemeToggle = true,
  sidebarFooter,
}: DocsLayoutProps) {
  const style = {
    "--sibl-accent": config.theme.accent,
    "--sibl-accent-dark": config.theme.accentDark,
  } as CSSProperties;

  const brandContent = brand ?? (
    <>
      <span aria-hidden="true" className="sibl-mark">
        {config.theme.mark}
      </span>
      <span>{config.title}</span>
    </>
  );

  return (
    <div className={classNames("sibl-root", className)} style={style}>
      <a className="sibl-skip-link" href="#sibl-content">
        Skip to content
      </a>
      <header className="sibl-header">
        <div className="sibl-header-inner">
          <Link className="sibl-brand" href={config.basePath}>
            {brandContent}
          </Link>
          <div className="sibl-header-actions">
            {config.links.length > 0 ? (
              <nav aria-label="Project" className="sibl-project-links">
                {config.links.map((link) => (
                  <a href={link.href} key={link.href}>
                    {link.label}
                  </a>
                ))}
              </nav>
            ) : null}
            {headerActions}
            {showSearch ? (
              <SearchButton
                indexUrl={config.outputs.searchIndex}
                placeholder={config.search.placeholder}
              />
            ) : null}
            {showThemeToggle ? (
              <ThemeToggle storageKey={config.theme.storageKey} />
            ) : null}
          </div>
        </div>
      </header>

      <div className="sibl-mobile-nav">
        <details>
          <summary>Browse documentation</summary>
          <DocsNavigation config={config} currentSlug={currentSlug} />
        </details>
      </div>

      <div className="sibl-grid">
        <aside className="sibl-sidebar">
          <DocsNavigation config={config} currentSlug={currentSlug} />
          {sidebarFooter ? (
            <div className="sibl-sidebar-footer">{sidebarFooter}</div>
          ) : null}
        </aside>

        <main className="sibl-main" id="sibl-content">
          {children}
        </main>

        <aside className="sibl-toc">
          {showTableOfContents ? <DocsTableOfContents /> : null}
        </aside>
      </div>
      {footer ? <footer className="sibl-footer">{footer}</footer> : null}
    </div>
  );
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
      {page.eyebrow ?? page.section ? (
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
        <span />
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
  showPageHeader?: boolean;
}

export function DocsPage({
  children,
  page,
  showPageHeader = true,
  ...layoutProps
}: DocsPageProps) {
  return (
    <DocsLayout {...layoutProps} currentSlug={page.slug}>
      <DocsArticle>
        {showPageHeader ? <DocsPageHeader page={page} /> : null}
        {children}
        <DocsPagination config={layoutProps.config} currentSlug={page.slug} />
      </DocsArticle>
    </DocsLayout>
  );
}

export { Callout, type CalloutProps } from "./callout.js";
export { SearchButton, type SearchButtonProps } from "./search-ui.js";
export { ThemeToggle, useDocsTheme, type Theme } from "./theme.js";
export { DocsTableOfContents } from "./toc.js";
