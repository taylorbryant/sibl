import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineDocs } from "../src/config.js";
import {
  SiglumContentError,
  createDocs,
  extractHeadings,
  stripMarkdown,
} from "../src/server.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});
async function fixture() {
  const rootDir = await mkdtemp(path.join(tmpdir(), "siglum-test-"));
  temporaryDirectories.push(rootDir);
  const contentDir = path.join(rootDir, "docs");
  await mkdir(contentDir, { recursive: true });
  await writeFile(
    path.join(contentDir, "index.md"),
    `---\ndescription: Start here.\n---\n\nWelcome to **Siglum**.\n\n## First section\n\nHello.\n`,
  );
  await writeFile(
    path.join(contentDir, "install.md"),
    `Install with \`bun add siglum\`.\n\n## Repeat\n\nOne.\n\n## Repeat\n\nTwo.\n`,
  );

  const config = defineDocs({
    title: "Example",
    description: "Example docs.",
    contentDir: "docs",
    siteUrl: "https://example.com",
    navigation: [
      {
        label: "Guide",
        items: [
          { title: "Introduction", slug: "" },
          {
            title: "Installation",
            slug: "install",
            description: "Install the package.",
          },
        ],
      },
    ],
  });

  return { config, docs: createDocs(config, { rootDir }), rootDir };
}

describe("createDocs", () => {
  test("loads manifest pages and frontmatter", async () => {
    const { docs } = await fixture();
    const page = await docs.getPage([]);

    expect(page?.title).toBe("Introduction");
    expect(page?.description).toBe("Start here.");
    expect(page?.href).toBe("/docs");
    expect(page?.headings).toEqual([
      { depth: 2, id: "first-section", text: "First section" },
    ]);
  });

  test("generates stable static params and reader outputs", async () => {
    const { docs } = await fixture();

    expect(docs.generateStaticParams()).toEqual([
      { slug: [] },
      { slug: ["install"] },
    ]);

    const llms = await docs.getLlmsText();
    expect(llms).toContain(
      "[Installation](https://example.com/docs/install): Install the package.",
    );

    const fullText = await docs.getLlmsFullText();
    expect(fullText).toContain("Install with `bun add siglum`");

    const index = await docs.getSearchIndex();
    expect(index[0]?.content).toBe("Welcome to Siglum. First section Hello.");
  });

  test("fails with an actionable missing-file error", async () => {
    const { config, rootDir } = await fixture();
    const broken = defineDocs({
      ...config,
      navigation: [
        ...config.navigation,
        {
          label: "Missing",
          items: [{ title: "No file", slug: "missing" }],
        },
      ],
    });
    const docs = createDocs(broken, { rootDir });

    await expect(docs.validate()).rejects.toBeInstanceOf(SiglumContentError);
    await expect(docs.validate()).rejects.toThrow("docs/missing.md");
  });
});

describe("Markdown utilities", () => {
  test("deduplicates heading identifiers and skips code fences", () => {
    expect(
      extractHeadings("## Hello\n## Hello\n```md\n## Not a heading\n```"),
    ).toEqual([
      { depth: 2, id: "hello", text: "Hello" },
      { depth: 2, id: "hello-2", text: "Hello" },
    ]);
  });

  test("creates compact plain text", () => {
    expect(stripMarkdown("## Hello\n\nRead [the guide](/guide)."),).toBe(
      "Hello Read the guide.",
    );
  });
});
