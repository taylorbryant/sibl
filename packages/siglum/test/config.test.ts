import { describe, expect, test } from "bun:test";
import { defineDocs } from "../src/config.js";
import {
  adjacentNavigationItems,
  flattenNavigation,
  pageHref,
} from "../src/navigation.js";

const input = {
  title: "Example",
  description: "Example documentation.",
  navigation: [
    {
      label: "Guide",
      items: [
        { title: "Introduction", slug: "" },
        { title: "Install", slug: "install" },
      ],
    },
  ],
} as const;

describe("defineDocs", () => {
  test("applies stable defaults", () => {
    const config = defineDocs(input);

    expect(config.basePath).toBe("/docs");
    expect(config.contentDir).toBe("content/docs");
    expect(config.theme.mark).toBe("§");
  });

  test("rejects duplicate routes", () => {
    expect(() =>
      defineDocs({
        ...input,
        navigation: [
          ...input.navigation,
          {
            label: "Reference",
            items: [{ title: "Duplicate", slug: "install" }],
          },
        ],
      }),
    ).toThrow("Duplicate documentation slug");
  });

  test("rejects traversal in the content directory", () => {
    expect(() => defineDocs({ ...input, contentDir: "../private" })).toThrow(
      "contentDir must be a relative path",
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
