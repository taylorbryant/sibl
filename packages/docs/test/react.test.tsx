import { describe, expect, test } from "bun:test";
import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef, ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { defineDocs } from "../src/config.js";
import { createMdxComponents } from "../src/mdx.js";
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

describe("MDX components", () => {
  test("keeps heading text plain and exposes a separate permalink", () => {
    const components: MDXComponents = createMdxComponents();
    const Heading = components.h2 as ComponentType<
      ComponentPropsWithoutRef<"h2">
    >;
    const markup = renderToStaticMarkup(
      <Heading id="configuration">Configuration</Heading>,
    );

    expect(markup).toContain('<h2 id="configuration">Configuration<a');
    expect(markup).toContain('class="sibl-heading-permalink"');
    expect(markup).toContain('href="#configuration"');
    expect(markup).toContain("Link to Configuration");
    expect(markup).not.toContain('href="#configuration">Configuration</a>');
  });

  test("renders persistent headers on single and multiline code blocks", () => {
    const components: MDXComponents = createMdxComponents();
    const CodeBlock = components.pre as ComponentType<
      ComponentPropsWithoutRef<"pre">
    >;
    const singleLine = renderToStaticMarkup(
      <CodeBlock>
        <code className="language-tsx">
          <span className="line">
            import &quot;@sibl/docs/styles.css&quot;;
          </span>
        </code>
      </CodeBlock>,
    );
    const multiline = renderToStaticMarkup(
      <CodeBlock>
        <code className="language-tsx">
          <span className="line">
            import createMDX from &quot;@next/mdx&quot;;
          </span>
          {"\n"}
          <span className="line">export default createMDX();</span>
        </code>
      </CodeBlock>,
    );

    expect(singleLine).toContain('class="sibl-code-actions"');
    expect(singleLine).toContain("<span>TypeScript</span>");
    expect(singleLine).toContain('aria-label="Copy code"');
    expect(multiline).toContain('class="sibl-code-actions"');
    expect(multiline).toContain("<span>TypeScript</span>");
    expect(multiline).toContain('aria-label="Copy code"');
  });
});
