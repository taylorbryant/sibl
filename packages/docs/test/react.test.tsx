import { describe, expect, test } from "bun:test";
import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef, ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Callout } from "../src/callout.js";
import { defineDocs } from "../src/config.js";
import { createMdxComponents } from "../src/mdx.js";
import {
  createDocsViewport,
  DocsPage,
  DocsPageWithHeader,
  DocsThemeScript,
} from "../src/react.js";
import type { DocsPageDescriptor } from "../src/server.js";

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

const page: DocsPageDescriptor = {
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
    expect(markup).toContain("--sibl-background-light:#ffffff");
    expect(markup).toContain("--sibl-background-dark:#282a36");
    expect(markup).toContain("MDX-owned title");
    expect(markup).not.toContain('class="sibl-page-header"');
  });

  test("bootstraps the browser chrome color with the stored theme", () => {
    const markup = renderToStaticMarkup(
      <DocsThemeScript
        theme={{
          background: { light: "#f8fafc", dark: "#10131a" },
          storageKey: "example-theme",
        }}
      />,
    );

    expect(markup).toContain('meta[name="theme-color"]');
    expect(markup).toContain("#10131a");
    expect(markup).toContain("#f8fafc");
    expect(markup).toContain("example-theme");
    expect(createDocsViewport(config.theme)).toEqual({
      themeColor: [
        { color: "#ffffff", media: "(prefers-color-scheme: light)" },
        { color: "#282a36", media: "(prefers-color-scheme: dark)" },
      ],
    });
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
  test("keeps callout titles outside global paragraph spacing", () => {
    const markup = renderToStaticMarkup(
      <Callout title="Context">
        <p>Supporting detail.</p>
      </Callout>,
    );

    expect(markup).toContain('<div class="sibl-callout-title">Context</div>');
    expect(markup).not.toContain('<p class="sibl-callout-title">');
  });

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
    expect(markup).toContain('aria-label="Link to Configuration"');
    expect(markup).toContain('href="#configuration"></a>');
    expect(markup).not.toContain(">#</a>");
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

  test("prefixes root-relative MDX images for path-based deployments", () => {
    const components: MDXComponents = createMdxComponents(
      {},
      { config: { appBasePath: "/preview" } },
    );
    const Image = components.img as ComponentType<
      ComponentPropsWithoutRef<"img">
    >;
    const localImage = renderToStaticMarkup(
      <Image alt="Diagram" src="/diagram.svg" />,
    );
    const remoteImage = renderToStaticMarkup(
      <Image alt="Diagram" src="https://example.com/diagram.svg" />,
    );

    expect(localImage).toContain('src="/preview/diagram.svg"');
    expect(remoteImage).toContain('src="https://example.com/diagram.svg"');
  });
});
