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
    <section className="siglum-nav-section" key={section.label}>
      <p className="siglum-nav-label">{section.label}</p>
      <ul className="siglum-nav-list">
        {section.items.map((item) => {
          const active = item.slug === currentSlug;
          return (
            <li key={item.slug || "index"}>
              <Link
                aria-current={active ? "page" : undefined}
                className="siglum-nav-link"
                data-active={active || undefined}
                href={pageHref(config, item.slug)}
              >
                <span>{item.navLabel ?? item.title}</span>
                {item.badge ? (
                  <span className="siglum-badge">{item.badge}</span>
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
    "--siglum-accent": config.theme.accent,
    "--siglum-accent-dark": config.theme.accentDark,
  } as CSSProperties;

  const brandContent = brand ?? (
    <>
      <span aria-hidden="true" className="siglum-mark">
        {config.theme.mark}
      </span>
      <span>{config.title}</span>
    </>
  );

  return (
    <div className={classNames("siglum-root", className)} style={style}>
      <a className="siglum-skip-link" href="#siglum-content">
        Skip to content
      </a>
      <header className="siglum-header">
        <div className="siglum-header-inner">
          <Link className="siglum-brand" href={config.basePath}>
            {brandContent}
          </Link>
          <div className="siglum-header-actions">
            {config.links.length > 0 ? (
              <nav aria-label="Project" className="siglum-project-links">
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

      <div className="siglum-mobile-nav">
        <details>
          <summary>Browse documentation</summary>
          <DocsNavigation config={config} currentSlug={currentSlug} />
        </details>
      </div>

      <div className="siglum-grid">
        <aside className="siglum-sidebar">
          <DocsNavigation config={config} currentSlug={currentSlug} />
          {sidebarFooter ? (
            <div className="siglum-sidebar-footer">{sidebarFooter}</div>
          ) : null}
        </aside>

        <main className="siglum-main" id="siglum-content">
          {children}
        </main>

        <aside className="siglum-toc">
          {showTableOfContents ? <DocsTableOfContents /> : null}
        </aside>
      </div>
      {footer ? <footer className="siglum-footer">{footer}</footer> : null}
    </div>
  );
}

export interface DocsArticleProps {
  children: ReactNode;
  className?: string;
}

export function DocsArticle({ children, className }: DocsArticleProps) {
  return (
    <article className={classNames("siglum-article", "siglum-prose", className)}>
      {children}
    </article>
  );
}

export function DocsPageHeader({ page }: { page: DocsPageData }) {
  return (
    <header className="siglum-page-header">
      {page.eyebrow ?? page.section ? (
        <p className="siglum-eyebrow">{page.eyebrow ?? page.section}</p>
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
    <nav aria-label="Pagination" className="siglum-pagination">
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
          className="siglum-pagination-next"
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
