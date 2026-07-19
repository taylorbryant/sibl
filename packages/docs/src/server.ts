import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import GithubSlugger from "github-slugger";
import type { DocsConfig } from "./config.js";
import {
  cleanMdx,
  extractHeadingIds,
  extractHeadings,
  stripMarkdown,
} from "./markdown.js";
import {
  findNavigationItem,
  flattenNavigation,
  normalizeSlug,
  pageHref,
  publicHref,
} from "./navigation.js";
import type { SearchEntry } from "./search.js";

export interface DocsPageDescriptor {
  description?: string;
  eyebrow?: string;
  href: string;
  section: string;
  segments: string[];
  slug: string;
  source: string;
  title: string;
}

export interface CreateDocsOptions {
  rootDir?: string;
}

export interface WriteDocsOutputsOptions {
  outputDir?: string;
}

export class SiblContentError extends Error {
  override name = "SiblContentError";
}

type DocsContentRegistry = Readonly<Record<string, unknown>>;
type IndexableDocsContent<T extends DocsContentRegistry> = T &
  Readonly<Record<string, T[keyof T] | undefined>>;

export interface Docs {
  readonly config: DocsConfig;
  defineContent<const T extends DocsContentRegistry>(
    content: T,
  ): IndexableDocsContent<T>;
  generateStaticParams(): Array<{ slug: string[] }>;
  getLlmsFullText(): Promise<string>;
  getLlmsText(): Promise<string>;
  getPage(slug?: string | string[]): DocsPageDescriptor | null;
  getPages(): DocsPageDescriptor[];
  getSearchIndex(): Promise<SearchEntry[]>;
  validate(): Promise<void>;
  writeOutputs(options?: WriteDocsOutputsOptions): Promise<string[]>;
}

function absolutePageHref(config: DocsConfig, slug: string): string {
  const href = publicHref(config, pageHref(config, slug));
  return config.siteUrl ? new URL(href, config.siteUrl).toString() : href;
}

function absolutePublicHref(config: DocsConfig, href: string): string {
  const publicPath = publicHref(config, href);
  return config.siteUrl
    ? new URL(publicPath, config.siteUrl).toString()
    : publicPath;
}

function descriptor(
  config: DocsConfig,
  item: ReturnType<typeof flattenNavigation>[number],
): DocsPageDescriptor {
  return {
    description: item.description,
    eyebrow: item.eyebrow,
    href: pageHref(config, item.slug),
    section: item.section,
    segments: item.slug ? item.slug.split("/") : [],
    slug: item.slug,
    source: item.source,
    title: item.title,
  };
}

function cleanSearchLine(value: string): string {
  return value
    .replace(/^\s*>+\s?/, "")
    .replace(/^\s*([-+*]|\d+\.)\s+/, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<\/?[A-Za-z][^<>]*\/?>/g, " ")
    .replace(/[`*|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchEntriesForPage(
  page: DocsPageDescriptor,
  source: string,
): SearchEntry[] {
  const maximumBodyLength = 600;
  const slugger = new GithubSlugger();
  const sections: Array<{
    heading: string;
    headingId: string;
    prose: string[];
    code: string[];
  }> = [{ heading: page.title, headingId: "", prose: [], code: [] }];
  let current = sections[0];
  let inFence = false;

  for (const line of cleanMdx(source).split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      const code = line.trim();
      if (code) current?.code.push(code);
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (headingMatch) {
      const heading = cleanSearchLine(headingMatch[2] ?? "");
      const headingId = slugger.slug(heading);
      const depth = headingMatch[1]?.length ?? 0;
      if (depth === 2 || depth === 3) {
        current = { heading, headingId, prose: [], code: [] };
        sections.push(current);
      }
      continue;
    }

    const prose = cleanSearchLine(line);
    if (prose) current?.prose.push(prose);
  }

  return sections.map((section) => {
    const prose = section.prose.join(" ");
    const room = Math.max(0, maximumBodyLength - prose.length);
    const code = section.code.join(" ").slice(0, room);
    return {
      route: page.href,
      pageTitle: page.title,
      sectionLabel: page.section,
      heading: section.heading,
      headingId: section.headingId,
      body: `${prose} ${code}`.trim().slice(0, maximumBodyLength),
    };
  });
}

function outputFilePath(outputDir: string, routePath: string): string {
  return path.join(outputDir, routePath.replace(/^\/+/, ""));
}

interface MarkdownLink {
  href: string;
  line: number;
}

function markdownLinks(source: string): MarkdownLink[] {
  const links: MarkdownLink[] = [];
  let inFence = false;

  for (const [index, sourceLine] of source.split("\n").entries()) {
    if (/^\s*(```|~~~)/.test(sourceLine)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const line = sourceLine.replace(/(`+)(.+?)\1/g, "");
    const pattern =
      /(?<!!)\[[^\]]*\]\(\s*<?([^\s)>]+)>?(?:\s+["'][^)]*["'])?\s*\)/g;
    for (const match of line.matchAll(pattern)) {
      const href = match[1];
      if (href) links.push({ href, line: index + 1 });
    }
  }

  return links;
}

function normalizedPathname(value: string): string {
  if (value === "/") return value;
  return value.replace(/\/+$/, "") || "/";
}

function deploymentIndependentPath(
  config: DocsConfig,
  pathname: string,
): string {
  const prefix = config.appBasePath;
  if (!prefix) return normalizedPathname(pathname);
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) {
    return normalizedPathname(pathname.slice(prefix.length));
  }
  return normalizedPathname(pathname);
}

function isDocumentationPath(config: DocsConfig, pathname: string): boolean {
  if (config.docsPath === "/") return true;
  return (
    pathname === config.docsPath || pathname.startsWith(`${config.docsPath}/`)
  );
}

function isPublicFile(config: DocsConfig, pathname: string): boolean {
  const outputs = Object.values(config.outputs).map(normalizedPathname);
  return outputs.includes(pathname) || path.posix.extname(pathname) !== "";
}

function validateInternalLinks(
  config: DocsConfig,
  sources: Array<{ page: DocsPageDescriptor; source: string }>,
): void {
  const pagesByPath = new Map(
    sources.map(({ page }) => [normalizedPathname(page.href), page]),
  );
  const headingsByPath = new Map(
    sources.map(({ page, source }) => [
      normalizedPathname(page.href),
      new Set(extractHeadingIds(source)),
    ]),
  );
  const issues: string[] = [];

  for (const { page, source } of sources) {
    for (const link of markdownLinks(source)) {
      if (
        link.href.startsWith("//") ||
        /^[a-z][a-z0-9+.-]*:/i.test(link.href)
      ) {
        continue;
      }

      let target: URL;
      try {
        target = new URL(link.href, `https://sibl.invalid${page.href}`);
      } catch {
        issues.push(
          `${page.source}:${link.line} has an invalid internal link: ${link.href}`,
        );
        continue;
      }

      const pathname = deploymentIndependentPath(config, target.pathname);
      if (isPublicFile(config, pathname)) continue;
      if (!isDocumentationPath(config, pathname)) continue;

      const targetPage = pagesByPath.get(pathname);
      if (!targetPage) {
        issues.push(
          `${page.source}:${link.line} links to a missing documentation page: ${link.href}`,
        );
        continue;
      }

      if (!target.hash) continue;
      let headingId: string;
      try {
        headingId = decodeURIComponent(target.hash.slice(1));
      } catch {
        headingId = target.hash.slice(1);
      }
      if (!headingsByPath.get(pathname)?.has(headingId)) {
        issues.push(
          `${page.source}:${link.line} links to a missing heading in ${targetPage.source}: #${headingId}`,
        );
      }
    }
  }

  if (issues.length > 0) {
    throw new SiblContentError(
      `Documentation link validation failed:\n- ${issues.join("\n- ")}`,
    );
  }
}

function validateDocsContent<const T extends DocsContentRegistry>(
  pages: readonly DocsPageDescriptor[],
  content: T,
): IndexableDocsContent<T> {
  const expected = new Set(pages.map((page) => page.slug));
  const actual = new Set(Object.keys(content));
  const missing = [...expected].filter((slug) => !actual.has(slug));
  const unexpected = [...actual].filter((slug) => !expected.has(slug));

  if (missing.length === 0 && unexpected.length === 0) {
    return content as IndexableDocsContent<T>;
  }

  const displaySlug = (slug: string) => (slug === "" ? "<root>" : slug);
  const details = [
    missing.length > 0
      ? `Missing MDX imports for: ${missing.map(displaySlug).join(", ")}.`
      : "",
    unexpected.length > 0
      ? `Unexpected MDX imports for: ${unexpected.map(displaySlug).join(", ")}.`
      : "",
  ].filter(Boolean);

  throw new SiblContentError(
    `The MDX content registry does not match documentation navigation. ${details.join(" ")}`,
  );
}

export function createDocs(
  config: DocsConfig,
  options: CreateDocsOptions = {},
): Docs {
  const rootDir = path.resolve(
    /* turbopackIgnore: true */ options.rootDir ?? process.cwd(),
  );
  const pages = flattenNavigation(config.navigation).map((item) =>
    descriptor(config, item),
  );

  function sourcePath(page: DocsPageDescriptor): string {
    return path.resolve(/* turbopackIgnore: true */ rootDir, page.source);
  }

  async function readPageSource(page: DocsPageDescriptor): Promise<string> {
    try {
      return await readFile(
        /* turbopackIgnore: true */ sourcePath(page),
        "utf8",
      );
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        throw new SiblContentError(
          `No MDX source found for "${page.title}". Expected ${page.source}.`,
        );
      }
      throw error;
    }
  }

  function getPage(slug?: string | string[]): DocsPageDescriptor | null {
    const item = findNavigationItem(config, normalizeSlug(slug));
    return item ? descriptor(config, item) : null;
  }

  function getPages(): DocsPageDescriptor[] {
    return pages.slice();
  }

  function generateStaticParams(): Array<{ slug: string[] }> {
    return pages.map((page) => ({ slug: page.segments }));
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

    lines.push(
      "",
      "## Full documentation",
      "",
      `- [llms-full.txt](${absolutePublicHref(config, config.outputs.llmsFull)}): Full text of every documentation page.`,
    );

    return `${lines.join("\n")}\n`;
  }

  async function getLlmsFullText(): Promise<string> {
    const sources = await Promise.all(
      pages.map(async (page) => ({ page, source: await readPageSource(page) })),
    );
    const sections = sources.map(({ page, source }) =>
      [
        `# ${page.title}`,
        `Source: ${absolutePageHref(config, page.slug)}`,
        "",
        cleanMdx(source).replace(/^#\s+.+(?:\r?\n)+/, ""),
      ]
        .join("\n")
        .trim(),
    );

    return `${sections.join("\n\n---\n\n")}\n`;
  }

  async function getSearchIndex(): Promise<SearchEntry[]> {
    const entries = await Promise.all(
      pages.map(async (page) =>
        searchEntriesForPage(page, await readPageSource(page)),
      ),
    );
    return entries.flat();
  }

  async function validate(): Promise<void> {
    const sources = await Promise.all(
      pages.map(async (page) => {
        const source = await readPageSource(page);
        extractHeadings(source);
        stripMarkdown(source);
        return { page, source };
      }),
    );
    validateInternalLinks(config, sources);
  }

  async function writeOutputs(
    writeOptions: WriteDocsOutputsOptions = {},
  ): Promise<string[]> {
    const outputDir = path.resolve(
      /* turbopackIgnore: true */ rootDir,
      writeOptions.outputDir ?? "public",
    );
    const outputs = [
      {
        file: outputFilePath(outputDir, config.outputs.llms),
        content: await getLlmsText(),
      },
      {
        file: outputFilePath(outputDir, config.outputs.llmsFull),
        content: await getLlmsFullText(),
      },
      {
        file: outputFilePath(outputDir, config.outputs.searchIndex),
        content: `${JSON.stringify(await getSearchIndex())}\n`,
      },
    ];

    for (const output of outputs) {
      await mkdir(path.dirname(output.file), { recursive: true });
      await writeFile(output.file, output.content);
    }

    return outputs.map((output) => output.file);
  }

  function defineContent<const T extends DocsContentRegistry>(
    content: T,
  ): IndexableDocsContent<T> {
    return validateDocsContent(pages, content);
  }

  return {
    config,
    defineContent,
    generateStaticParams,
    getLlmsFullText,
    getLlmsText,
    getPage,
    getPages,
    getSearchIndex,
    validate,
    writeOutputs,
  };
}
