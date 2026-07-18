import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { DocsConfig, NavigationSection } from "./config.js";
import {
  extractHeadings,
  stripMarkdown,
  type DocsHeading,
} from "./markdown.js";
import {
  findNavigationItem,
  flattenNavigation,
  normalizeSlug,
  pageHref,
} from "./navigation.js";

const pageMatterSchema = z
  .object({
    description: z.string().trim().min(1).optional(),
    eyebrow: z.string().trim().min(1).optional(),
  })
  .passthrough();

export interface DocsPage {
  body: string;
  description?: string;
  eyebrow?: string;
  headings: DocsHeading[];
  href: string;
  section: string;
  segments: string[];
  slug: string;
  sourcePath: string;
  title: string;
}

export interface SearchIndexItem {
  content: string;
  description?: string;
  href: string;
  id: string;
  section: string;
  title: string;
}

export interface CreateDocsOptions {
  rootDir: string;
}

export class SiglumContentError extends Error {
  override name = "SiglumContentError";
}

function parseFrontmatter(source: string): {
  content: string;
  data: unknown;
} {
  const normalized = source.replace(/^\uFEFF/, "");
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(normalized);
  if (!match) return { content: normalized, data: {} };

  let data: unknown;
  try {
    data = parseYaml(match[1] ?? "") ?? {};
  } catch (error) {
    throw new SiglumContentError(
      `Could not parse page frontmatter: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return {
    content: normalized.slice(match[0].length),
    data,
  };
}

async function firstReadableFile(
  candidates: string[],
): Promise<string | undefined> {
  for (const candidate of candidates) {
    try {
      await access(/* turbopackIgnore: true */ candidate);
      return candidate;
    } catch {
      // Keep looking. The final error lists every supported location.
    }
  }
  return undefined;
}

function fileCandidates(contentRoot: string, slug: string): string[] {
  if (!slug) {
    return [path.join(/* turbopackIgnore: true */ contentRoot, "index.md")];
  }

  return [
    path.join(/* turbopackIgnore: true */ contentRoot, `${slug}.md`),
    path.join(/* turbopackIgnore: true */ contentRoot, slug, "index.md"),
  ];
}

function absolutePageHref(config: DocsConfig, slug: string): string {
  const href = pageHref(config, slug);
  return config.siteUrl ? new URL(href, config.siteUrl).toString() : href;
}

export function createDocs(
  config: DocsConfig,
  options: CreateDocsOptions,
) {
  const rootDir = path.resolve(
    /* turbopackIgnore: true */ options.rootDir,
  );
  const contentRoot = path.resolve(
    /* turbopackIgnore: true */ rootDir,
    config.contentDir,
  );

  async function loadPage(slug: string): Promise<DocsPage | null> {
    const item = findNavigationItem(config, slug);
    if (!item) return null;

    const candidates = fileCandidates(contentRoot, item.slug);
    const sourcePath = await firstReadableFile(candidates);
    if (!sourcePath) {
      const relativeCandidates = candidates.map((candidate) =>
        path.relative(rootDir, candidate),
      );
      throw new SiglumContentError(
        `No Markdown file found for "${item.title}". Expected ${relativeCandidates.join(" or ")}.`,
      );
    }

    const source = await readFile(
      /* turbopackIgnore: true */ sourcePath,
      "utf8",
    );
    const parsed = parseFrontmatter(source);
    const frontmatter = pageMatterSchema.parse(parsed.data);

    return {
      body: parsed.content.trim(),
      description: frontmatter.description ?? item.description,
      eyebrow: frontmatter.eyebrow,
      headings: extractHeadings(parsed.content),
      href: pageHref(config, item.slug),
      section: item.section,
      segments: item.slug ? item.slug.split("/") : [],
      slug: item.slug,
      sourcePath,
      title: item.title,
    };
  }

  async function getPage(
    slug?: string | string[],
  ): Promise<DocsPage | null> {
    return loadPage(normalizeSlug(slug));
  }

  async function getPages(): Promise<DocsPage[]> {
    const pages = await Promise.all(
      flattenNavigation(config.navigation).map((item) => loadPage(item.slug)),
    );
    return pages.filter((page): page is DocsPage => page !== null);
  }

  function generateStaticParams(): Array<{ slug: string[] }> {
    return flattenNavigation(config.navigation).map((item) => ({
      slug: item.slug ? item.slug.split("/") : [],
    }));
  }

  async function getLlmsText(): Promise<string> {
    const lines = [`# ${config.title}`, "", `> ${config.description}`];

    for (const section of config.navigation) {
      lines.push("", `## ${section.label}`, "");
      for (const item of section.items) {
        const description = item.description ? `: ${item.description}` : "";
        lines.push(
          `- [${item.title}](${absolutePageHref(config, item.slug)})${description}`,
        );
      }
    }

    return `${lines.join("\n")}\n`;
  }

  async function getLlmsFullText(): Promise<string> {
    const pages = await getPages();
    const lines = [`# ${config.title}`, "", `> ${config.description}`];

    for (const page of pages) {
      lines.push(
        "",
        "---",
        "",
        `## ${page.title}`,
        "",
        `Source: ${absolutePageHref(config, page.slug)}`,
      );
      if (page.description) lines.push("", page.description);
      lines.push("", page.body);
    }

    return `${lines.join("\n")}\n`;
  }

  async function getSearchIndex(): Promise<SearchIndexItem[]> {
    const pages = await getPages();
    return pages.map((page) => ({
      content: stripMarkdown(page.body),
      description: page.description,
      href: page.href,
      id: page.slug || "index",
      section: page.section,
      title: page.title,
    }));
  }

  async function validate(): Promise<void> {
    await getPages();
  }

  return {
    config,
    generateStaticParams,
    getLlmsFullText,
    getLlmsText,
    getPage,
    getPages,
    getSearchIndex,
    navigation: config.navigation as NavigationSection[],
    validate,
  };
}

export type DocsSource = ReturnType<typeof createDocs>;

export {
  extractHeadings,
  slugifyHeading,
  stripMarkdown,
} from "./markdown.js";
export type { DocsHeading } from "./markdown.js";
