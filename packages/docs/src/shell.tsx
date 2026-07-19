"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import type { DocsConfig, NavigationSection } from "./config.js";
import { pageHref, publicHref } from "./navigation.js";
import { SearchButton } from "./search-ui.js";
import { ThemeToggle } from "./theme.js";
import { DocsTableOfContents } from "./toc.js";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function NavigationSections({
  config,
  currentSlug,
  navigation,
  onNavigate,
}: {
  config: DocsConfig;
  currentSlug: string;
  navigation: NavigationSection[];
  onNavigate?: () => void;
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
                onClick={onNavigate}
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
  onNavigate?: () => void;
}

export function DocsNavigation({
  config,
  currentSlug,
  label = "Documentation",
  onNavigate,
}: DocsNavigationProps) {
  return (
    <nav aria-label={label}>
      <NavigationSections
        config={config}
        currentSlug={currentSlug}
        navigation={config.navigation}
        onNavigate={onNavigate}
      />
    </nav>
  );
}

function DefaultProjectLinks({ config }: { config: DocsConfig }) {
  if (config.links.length === 0) return null;
  return (
    <div className="sibl-sidebar-links">
      {config.links.map((link) => (
        <a
          href={link.href}
          key={link.href}
          rel={link.href.startsWith("http") ? "noreferrer" : undefined}
          target={link.href.startsWith("http") ? "_blank" : undefined}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

function SidebarMeta({
  config,
  content,
  showThemeToggle,
}: {
  config: DocsConfig;
  content?: ReactNode;
  showThemeToggle: boolean;
}) {
  return (
    <div className="sibl-sidebar-meta">
      <div className="sibl-sidebar-meta-content">
        {content ?? <DefaultProjectLinks config={config} />}
      </div>
      {showThemeToggle ? <ThemeToggle theme={config.theme} /> : null}
    </div>
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
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const style = {
    "--sibl-accent-light": config.theme.accent.light,
    "--sibl-accent-dark": config.theme.accent.dark,
    "--sibl-background-light": config.theme.background.light,
    "--sibl-background-dark": config.theme.background.dark,
  } as CSSProperties;
  const brandContent = brand ?? (
    <>
      <span aria-hidden="true" className="sibl-mark">
        {config.theme.mark}
      </span>
      <span>{config.title}</span>
    </>
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the mobile menu whenever the current documentation page changes
  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [currentSlug]);

  useEffect(() => {
    if (!mobileNavigationOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavigationOpen]);

  const closeMobileNavigation = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setMobileNavigationOpen(false);
  };

  return (
    <div className={classNames("sibl-root", className)} style={style}>
      <a className="sibl-skip-link" href="#sibl-content">
        Skip to content
      </a>

      <nav className="sibl-mobile-header">
        <div className="sibl-mobile-header-inner">
          <Link className="sibl-brand" href={config.docsPath}>
            {brandContent}
          </Link>
          <div className="sibl-mobile-actions">
            {headerActions}
            {showSearch ? (
              <SearchButton
                indexUrl={publicHref(config, config.outputs.searchIndex)}
                placeholder={config.search.placeholder}
              />
            ) : null}
            {showThemeToggle ? <ThemeToggle theme={config.theme} /> : null}
            <button
              aria-expanded={mobileNavigationOpen}
              aria-label={mobileNavigationOpen ? "Close menu" : "Open menu"}
              className="sibl-menu-button"
              onClick={() => setMobileNavigationOpen((open) => !open)}
              type="button"
            >
              <span data-open={mobileNavigationOpen || undefined} />
              <span data-open={mobileNavigationOpen || undefined} />
            </button>
          </div>
        </div>
      </nav>

      {mobileNavigationOpen ? (
        <div className="sibl-mobile-overlay">
          <div className="sibl-mobile-overlay-inner">
            <DocsNavigation
              config={config}
              currentSlug={currentSlug}
              onNavigate={closeMobileNavigation}
            />
            <SidebarMeta
              config={config}
              content={sidebarFooter}
              showThemeToggle={showThemeToggle}
            />
          </div>
        </div>
      ) : null}

      <aside className="sibl-sidebar">
        <Link className="sibl-brand" href={config.docsPath}>
          {brandContent}
        </Link>
        {showSearch ? (
          <SearchButton
            className="sibl-sidebar-search"
            indexUrl={publicHref(config, config.outputs.searchIndex)}
            placeholder={config.search.placeholder}
          />
        ) : null}
        {headerActions ? (
          <div className="sibl-sidebar-actions">{headerActions}</div>
        ) : null}
        <div className="sibl-sidebar-navigation">
          <DocsNavigation config={config} currentSlug={currentSlug} />
        </div>
        <SidebarMeta
          config={config}
          content={sidebarFooter}
          showThemeToggle={showThemeToggle}
        />
      </aside>

      <main className="sibl-main" id="sibl-content">
        {children}
      </main>

      {showTableOfContents ? (
        <aside className="sibl-toc">
          <DocsTableOfContents />
        </aside>
      ) : null}

      {footer ? (
        <footer className="sibl-footer">
          <div className="sibl-footer-inner">{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}
