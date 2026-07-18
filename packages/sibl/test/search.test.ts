import { describe, expect, test } from "bun:test";
import { searchDocs, tokenizeSearch, type SearchEntry } from "../src/search.js";

const entries: SearchEntry[] = [
  {
    route: "/docs",
    pageTitle: "Introduction",
    sectionLabel: "Guide",
    heading: "Introduction",
    headingId: "",
    body: "A documentation library for Next.js.",
  },
  {
    route: "/docs/configuration",
    pageTitle: "Configuration",
    sectionLabel: "Reference",
    heading: "Theme configuration",
    headingId: "theme-configuration",
    body: "Choose light and dark accent colors.",
  },
];

describe("searchDocs", () => {
  test("uses AND semantics and weights headings", () => {
    expect(searchDocs(entries, "theme configuration")[0]?.entry.heading).toBe(
      "Theme configuration",
    );
    expect(searchDocs(entries, "theme missing")).toEqual([]);
  });

  test("returns page introductions for an empty query", () => {
    expect(searchDocs(entries, "").map((result) => result.entry.heading)).toEqual([
      "Introduction",
    ]);
  });

  test("limits and normalizes query terms", () => {
    expect(tokenizeSearch("  Next.JS   Docs ")).toEqual(["next.js", "docs"]);
  });
});
