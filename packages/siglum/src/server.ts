import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import GithubSlugger from "github-slugger";
import type { DocsConfig, NavigationSection } from "./config.js";
import { cleanMdx, extractHeadings, stripMarkdown } from "./markdown.js";
import {
  findNavigationItem,
  flattenNavigation,
  normalizeSlug,
  pageHref,
} from "./navigation.js";
import type { SearchEntry } from "./search.js";

export interface DocsPage {
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
  rootDir: string;
}

export interface WriteDocsOutputsOptions {
  outputDir?: string;
}

export class SiglumContentError extends Error {
  override name = "SiglumContentError";
}

function absolutePageHref(config: DocsConfig, slug: string): string {
  const href = pageHref(config, slug);
  return config.siteUrl ? new URL(href, config.siteUrl).toString() : href;
}

function descriptor(
  config: DocsConfig,
  item: ReturnType<typeof flattenNavigation>[number],
): DocsPage {
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

function searchEntriesForPage(page: DocsPage, source: string): SearchEntry[] {
  const maximumBodyLength = 600;
  const slugger = new GithubSlugger();
  const sections: Array<{
    heading: string;
    headingId: string;
    prose: string[];
    code: string[];
  }> = [
    { heading: page.title, headingId: "", prose: [], code: [] },
  ];
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

export function createDocs(config: DocsConfig, options: CreateDocsOptions) {
  const rootDir = path.resolve(/* turbopackIgnore: true */ options.rootDir);
  const pages = flattenNavigation(config.navigation).map((item) =>
    descriptor(config, item),
  );

  function sourcePath(page: DocsPage): string {
    return path.resolve(/* turbopackIgnore: true */ rootDir, page.source);
  }

  async function readPageSource(page: DocsPage): Promise<string> {
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
        throw new SiglumContentError(
          `No MDX source found for "${page.title}". Expected ${page.source}.`,
        );
      }
      throw error;
    }
  }

  function getPage(slug?: string | string[]): DocsPage | null {
    const item = findNavigationItem(config, normalizeSlug(slug));
    return item ? descriptor(config, item) : null;
  }

  function getPages(): DocsPage[] {
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
      `- [llms-full.txt](${config.siteUrl ? new URL(config.outputs.llmsFull, config.siteUrl).toString() : config.outputs.llmsFull}): Full text of every documentation page.`,
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
    await Promise.all(
      pages.map(async (page) => {
        const source = await readPageSource(page);
        extractHeadings(source);
        stripMarkdown(source);
      }),
    );
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

  return {
    config,
    generateStaticParams,
    getLlmsFullText,
    getLlmsText,
    getPage,
    getPages,
    getSearchIndex,
    navigation: config.navigation as NavigationSection[],
    readPageSource,
    validate,
    writeOutputs,
  };
}

export type DocsSource = ReturnType<typeof createDocs>;

export {
  cleanMdx,
  extractHeadings,
  slugifyHeading,
  stripMarkdown,
} from "./markdown.js";
export type { DocsHeading } from "./markdown.js";
export type { SearchEntry } from "./search.js";
