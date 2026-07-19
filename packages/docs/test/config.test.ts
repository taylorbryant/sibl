import { describe, expect, test } from "bun:test";
import { defineDocs, docsConfigSchema } from "../src/config.js";
import {
  adjacentNavigationItems,
  flattenNavigation,
  pageHref,
  publicHref,
} from "../src/navigation.js";

const input = {
  title: "Example",
  description: "Example documentation.",
  navigation: [
    {
      label: "Guide",
      items: [
        { title: "Introduction", slug: "", source: "content/index.mdx" },
        {
          title: "Install",
          slug: "install",
          source: "content/install.mdx",
        },
      ],
    },
  ],
} as const;

describe("defineDocs", () => {
  test("applies stable defaults", () => {
    const config = defineDocs(input);

    expect(config.docsPath).toBe("/docs");
    expect(config.appBasePath).toBe("");
    expect(config.theme.accent).toEqual({
      light: "#4f46e5",
      dark: "#bd93f9",
    });
    expect(config.theme.background).toEqual({
      light: "#ffffff",
      dark: "#282a36",
    });
    expect(config.outputs.searchIndex).toBe("/search-index.json");
    expect(config.search.enabled).toBe(true);
  });

  test("does not share mutable defaults between configs", () => {
    const first = defineDocs(input);
    first.links.push({
      type: "external",
      href: "/changed",
      label: "Changed",
    });
    first.outputs.llms = "/changed.txt";
    first.search.enabled = false;
    first.theme.accent.light = "#000000";
    first.theme.background.dark = "#000000";

    const second = defineDocs(input);
    expect(second.links).toEqual([]);
    expect(second.outputs.llms).toBe("/llms.txt");
    expect(second.search.enabled).toBe(true);
    expect(second.theme.accent.light).toBe("#4f46e5");
    expect(second.theme.background.dark).toBe("#282a36");

    const partialFirst = defineDocs({ ...input, theme: {} });
    partialFirst.theme.accent.dark = "#000000";
    const partialSecond = defineDocs({ ...input, theme: {} });
    expect(partialSecond.theme.accent.dark).toBe("#bd93f9");
  });

  test("validates typed project links and version metadata", () => {
    const config = defineDocs({
      ...input,
      version: "0.10.0",
      links: [
        { type: "github", href: "https://github.com/example/docs" },
        {
          type: "pypi",
          href: "https://pypi.org/project/example",
          label: "Example package on PyPI",
        },
        {
          type: "external",
          href: "https://status.example.com",
          label: "Status",
        },
      ],
    });

    expect(config.version).toBe("0.10.0");
    expect(config.links.map((link) => link.type)).toEqual([
      "github",
      "pypi",
      "external",
    ]);
    expect(
      docsConfigSchema.safeParse({
        ...input,
        links: [{ href: "https://example.com", label: "Legacy link" }],
      }).success,
    ).toBe(false);
    expect(
      docsConfigSchema.safeParse({
        ...input,
        links: [{ type: "external", href: "https://example.com" }],
      }).success,
    ).toBe(false);
  });

  test("rejects duplicate routes and sources", () => {
    expect(() =>
      defineDocs({
        ...input,
        navigation: [
          ...input.navigation,
          {
            label: "Reference",
            items: [
              {
                title: "Duplicate",
                slug: "install",
                source: "content/duplicate.mdx",
              },
            ],
          },
        ],
      }),
    ).toThrow("Duplicate documentation slug");

    expect(() =>
      defineDocs({
        ...input,
        navigation: [
          ...input.navigation,
          {
            label: "Reference",
            items: [
              {
                title: "Duplicate",
                slug: "duplicate",
                source: "content/install.mdx",
              },
            ],
          },
        ],
      }),
    ).toThrow("Duplicate documentation source");
  });

  test("rejects unsafe or non-MDX source files", () => {
    expect(() =>
      defineDocs({
        ...input,
        navigation: [
          {
            label: "Guide",
            items: [{ title: "Private", slug: "", source: "../private.mdx" }],
          },
        ],
      }),
    ).toThrow("source must be a relative path");

    expect(() =>
      defineDocs({
        ...input,
        navigation: [
          {
            label: "Guide",
            items: [{ title: "Text", slug: "", source: "content/index.txt" }],
          },
        ],
      }),
    ).toThrow("source must point to a .md or .mdx file");
  });

  test("keeps generated output paths inside the target directory", () => {
    expect(() =>
      defineDocs({
        ...input,
        outputs: {
          llms: "/../llms.txt",
          llmsFull: "/llms-full.txt",
          searchIndex: "/search-index.json",
        },
      }),
    ).toThrow("Output paths cannot traverse");
  });

  test("normalizes application base paths", () => {
    const config = defineDocs({ ...input, appBasePath: "/project/" });

    expect(config.appBasePath).toBe("/project");
    expect(publicHref(config, "/search-index.json")).toBe(
      "/project/search-index.json",
    );
    expect(publicHref(config, "https://example.com/file.json")).toBe(
      "https://example.com/file.json",
    );
  });

  test("rejects removed fields and flat theme colors", () => {
    expect(
      docsConfigSchema.safeParse({ ...input, basePath: "/guide" }).success,
    ).toBe(false);
    expect(
      docsConfigSchema.safeParse({
        ...input,
        theme: {
          accent: "#112233",
          background: "#fefefe",
        },
      }).success,
    ).toBe(false);
    expect(
      docsConfigSchema.safeParse({
        ...input,
        theme: { mark: "E" },
      }).success,
    ).toBe(false);
  });
});

describe("navigation", () => {
  test("flattens sections and builds links", () => {
    const config = defineDocs(input);
    const pages = flattenNavigation(config.navigation);

    expect(pages.map((page) => page.section)).toEqual(["Guide", "Guide"]);
    expect(pageHref(config, "")).toBe("/docs");
    expect(pageHref(config, "install")).toBe("/docs/install");
  });

  test("finds previous and next pages", () => {
    const config = defineDocs(input);
    const adjacent = adjacentNavigationItems(config, "install");

    expect(adjacent.previous?.title).toBe("Introduction");
    expect(adjacent.next).toBeUndefined();
  });
});
