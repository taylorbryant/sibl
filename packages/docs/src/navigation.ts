import type {
  DocsConfig,
  NavigationItem,
  NavigationSection,
} from "./config.js";

export interface FlatNavigationItem extends NavigationItem {
  section: string;
}
export function flattenNavigation(
  navigation: NavigationSection[],
): FlatNavigationItem[] {
  return navigation.flatMap((section) =>
    section.items.map((item) => ({ ...item, section: section.label })),
  );
}

export function normalizeSlug(slug: string | string[] | undefined): string {
  if (Array.isArray(slug)) return slug.filter(Boolean).join("/");
  return (slug ?? "").replace(/^\/+|\/+$/g, "");
}

export function pageHref(config: DocsConfig, slug: string): string {
  const normalized = normalizeSlug(slug);
  if (!normalized) return config.docsPath;
  if (config.docsPath === "/") return `/${normalized}`;
  return `${config.docsPath}/${normalized}`;
}

/** Prefixes a root-relative public asset or URL with the deployment path. */
export function publicHref(
  config: Pick<DocsConfig, "appBasePath">,
  href: string,
): string {
  const basePath = config.appBasePath;
  if (!basePath || !href.startsWith("/")) return href;
  if (href === "/") return basePath;
  return `${basePath}${href}`;
}

export function findNavigationItem(
  config: DocsConfig,
  slug: string | string[] | undefined,
): FlatNavigationItem | undefined {
  const normalized = normalizeSlug(slug);
  return flattenNavigation(config.navigation).find(
    (item) => item.slug === normalized,
  );
}

export function adjacentNavigationItems(
  config: DocsConfig,
  slug: string,
): {
  previous?: FlatNavigationItem;
  next?: FlatNavigationItem;
} {
  const pages = flattenNavigation(config.navigation);
  const index = pages.findIndex((item) => item.slug === normalizeSlug(slug));

  if (index < 0) return {};

  return {
    previous: index > 0 ? pages[index - 1] : undefined,
    next: index < pages.length - 1 ? pages[index + 1] : undefined,
  };
}
