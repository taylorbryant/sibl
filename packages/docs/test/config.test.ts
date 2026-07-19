import { describe, expect, test } from "bun:test";
import { defineDocs } from "../src/config.js";
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

    expect(config.basePath).toBe("/docs");
    expect(config.deploymentBasePath).toBe("");
    expect(config.theme.mark).toBe("§");
    expect(config.theme.accent).toBe("#4f46e5");
    expect(config.theme.accentDark).toBe("#bd93f9");
    expect(config.theme.background).toBe("#ffffff");
    expect(config.theme.backgroundDark).toBe("#282a36");
    expect(config.outputs.searchIndex).toBe("/search-index.json");
    expect(config.search.enabled).toBe(true);
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

  test("normalizes deployment base paths", () => {
    const config = defineDocs({ ...input, deploymentBasePath: "/project/" });

    expect(config.deploymentBasePath).toBe("/project");
    expect(publicHref(config, "/search-index.json")).toBe(
      "/project/search-index.json",
    );
    expect(publicHref(config, "https://example.com/file.json")).toBe(
      "https://example.com/file.json",
    );
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
