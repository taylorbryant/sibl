import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { defineDocs } from "../src/config.js";
import { DocsPage, DocsPageWithHeader } from "../src/react.js";
import type { DocsPage as DocsPageData } from "../src/server.js";

const config = defineDocs({
  title: "Example",
  description: "Example documentation.",
  navigation: [
    {
      label: "Start",
      items: [
        {
          title: "Overview",
          slug: "",
          source: "content/index.mdx",
        },
      ],
    },
  ],
});

const page: DocsPageData = {
  description: "Example overview.",
  href: "/docs",
  section: "Start",
  segments: [],
  slug: "",
  source: "content/index.mdx",
  title: "Overview",
};

const behaviorProps = {
  showSearch: false,
  showTableOfContents: false,
  showThemeToggle: false,
} as const;

describe("documentation shell", () => {
  test("renders the shared responsive shell and leaves the title to MDX", () => {
    const markup = renderToStaticMarkup(
      <DocsPage config={config} page={page} {...behaviorProps}>
        <h1>MDX-owned title</h1>
      </DocsPage>,
    );

    expect(markup).toContain('class="sibl-mobile-header"');
    expect(markup).toContain('class="sibl-sidebar"');
    expect(markup).toContain('class="sibl-main"');
    expect(markup).toContain("MDX-owned title");
    expect(markup).not.toContain('class="sibl-page-header"');
  });

  test("offers manifest-rendered headings as an explicit composition", () => {
    const markup = renderToStaticMarkup(
      <DocsPageWithHeader config={config} page={page} {...behaviorProps}>
        <p>Page body.</p>
      </DocsPageWithHeader>,
    );

    expect(markup).toContain('class="sibl-page-header"');
    expect(markup).toContain("Example overview.");
  });
});
