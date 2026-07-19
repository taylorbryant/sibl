import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineDocs } from "../src/config.js";
import {
  cleanMdx,
  createDocs,
  defineDocsContent,
  extractHeadings,
  SiblContentError,
  stripMarkdown,
} from "../src/server.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

async function fixture() {
  const rootDir = await mkdtemp(path.join(tmpdir(), "sibl-test-"));
  temporaryDirectories.push(rootDir);
  const contentDir = path.join(rootDir, "content");
  await mkdir(contentDir, { recursive: true });
  await writeFile(
    path.join(contentDir, "index.mdx"),
    `import { Callout } from "@sibl/docs/react";\n\n# Welcome\n\nWelcome to **Sibl**.\n\n<Callout>One source.</Callout>\n\n## First section\n\nHello.\n`,
  );
  await writeFile(
    path.join(contentDir, "install.mdx"),
    `# Installation\n\nInstall with \`bun add @sibl/docs\`.\n\n## Repeat\n\nOne.\n\n## Repeat\n\nTwo.\n`,
  );

  const config = defineDocs({
    title: "Example",
    description: "Example docs.",
    siteUrl: "https://example.com",
    navigation: [
      {
        label: "Guide",
        items: [
          {
            title: "Introduction",
            slug: "",
            source: "content/index.mdx",
            description: "Start here.",
          },
          {
            title: "Installation",
            slug: "install",
            source: "content/install.mdx",
            description: "Install the package.",
          },
        ],
      },
    ],
  });

  return { config, docs: createDocs(config, { rootDir }), rootDir };
}

describe("createDocs", () => {
  test("returns manifest page descriptors without compiling content", async () => {
    const { docs } = await fixture();
    const page = docs.getPage([]);

    expect(page).toEqual({
      title: "Introduction",
      description: "Start here.",
      href: "/docs",
      section: "Guide",
      segments: [],
      slug: "",
      source: "content/index.mdx",
    });
  });

  test("generates static params, agent text, and heading-level search", async () => {
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
    expect(fullText).toContain("Install with `bun add @sibl/docs`");
    expect(fullText).not.toContain("import { Callout }");

    const index = await docs.getSearchIndex();
    expect(index.map((entry) => entry.heading)).toEqual([
      "Introduction",
      "First section",
      "Installation",
      "Repeat",
      "Repeat",
    ]);
    expect(index[1]).toMatchObject({
      headingId: "first-section",
      route: "/docs",
      body: "Hello.",
    });
  });

  test("writes static output files for export-oriented applications", async () => {
    const { docs, rootDir } = await fixture();
    const files = await docs.writeOutputs({ outputDir: "generated" });

    expect(files).toHaveLength(3);
    expect(
      await readFile(path.join(rootDir, "generated/llms.txt"), "utf8"),
    ).toContain("# Example");
    expect(
      JSON.parse(
        await readFile(
          path.join(rootDir, "generated/search-index.json"),
          "utf8",
        ),
      ),
    ).toHaveLength(5);
  });

  test("validates the statically imported MDX registry", async () => {
    const { docs } = await fixture();
    const content = { "": "overview", install: "installation" } as const;

    expect(defineDocsContent(docs, content)).toBe(content);
    expect(() => defineDocsContent(docs, { "": "overview" })).toThrow(
      "Missing MDX imports for: install",
    );
    expect(() =>
      defineDocsContent(docs, {
        "": "overview",
        install: "installation",
        old: "removed",
      }),
    ).toThrow("Unexpected MDX imports for: old");
  });

  test("prefixes public URLs without changing output file locations", async () => {
    const { config, rootDir } = await fixture();
    const prefixed = defineDocs({
      ...config,
      deploymentBasePath: "/project",
    });
    const docs = createDocs(prefixed, { rootDir });

    expect(await docs.getLlmsText()).toContain(
      "https://example.com/project/docs/install",
    );
    expect(await docs.getLlmsText()).toContain(
      "https://example.com/project/llms-full.txt",
    );

    const files = await docs.writeOutputs({ outputDir: "prefixed" });
    expect(files).toContain(path.join(rootDir, "prefixed/llms.txt"));
    expect(files).not.toContain(
      path.join(rootDir, "prefixed/project/llms.txt"),
    );
  });

  test("fails with an actionable missing-file error", async () => {
    const { config, rootDir } = await fixture();
    const broken = defineDocs({
      ...config,
      navigation: [
        ...config.navigation,
        {
          label: "Missing",
          items: [
            {
              title: "No file",
              slug: "missing",
              source: "content/missing.mdx",
            },
          ],
        },
      ],
    });
    const docs = createDocs(broken, { rootDir });

    await expect(docs.validate()).rejects.toBeInstanceOf(SiblContentError);
    await expect(docs.validate()).rejects.toThrow("content/missing.mdx");
  });

  test("validates internal documentation pages and heading anchors", async () => {
    const { docs, rootDir } = await fixture();
    const indexFile = path.join(rootDir, "content/index.mdx");

    await writeFile(
      indexFile,
      `# Welcome\n\n[Repeated section](/docs/install#repeat-1)\n\n\`[Ignored](/docs/missing)\`\n\n\`\`\`md\n[Also ignored](/docs/missing)\n\`\`\`\n`,
    );
    await expect(docs.validate()).resolves.toBeUndefined();

    await writeFile(indexFile, "# Welcome\n\n[Missing](/docs/missing)\n");
    await expect(docs.validate()).rejects.toThrow(
      "links to a missing documentation page: /docs/missing",
    );

    await writeFile(
      indexFile,
      "# Welcome\n\n[Missing heading](/docs/install#not-there)\n",
    );
    await expect(docs.validate()).rejects.toThrow(
      "links to a missing heading in content/install.mdx: #not-there",
    );
  });
});

describe("MDX utilities", () => {
  test("deduplicates heading identifiers and skips code fences", () => {
    expect(
      extractHeadings(
        "# Hello\n## Hello\n## Hello\n```md\n## Not a heading\n```",
      ),
    ).toEqual([
      { depth: 2, id: "hello-1", text: "Hello" },
      { depth: 2, id: "hello-2", text: "Hello" },
    ]);
  });

  test("removes module and component syntax from agent output", () => {
    const source = `import { Callout } from "./callout";\n\n<Callout type="note">\nRead [the guide](/guide).\n</Callout>`;
    expect(cleanMdx(source)).toBe("Read [the guide](/guide).");
    expect(stripMarkdown(source)).toBe("Read the guide.");
  });

  test("removes native JSX tags while preserving prose and inline code", () => {
    const source = `# Example\n\nUse \`<div>\` when needed.\n\n<div className="frame">\n  <h1>Visible title</h1>\n  <LogoMark />\n</div>`;
    const cleaned = cleanMdx(source);

    expect(cleaned).toContain("Use `<div>` when needed.");
    expect(cleaned).toContain("Visible title");
    expect(cleaned).not.toContain('<div className="frame">');
    expect(cleaned).not.toContain("<h1>");
    expect(cleaned).not.toContain("<LogoMark");
  });
});
