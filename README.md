# Sibl

Sibl is a composable, Next-native documentation library built from a shared production documentation architecture. Next.js compiles and routes the MDX; Sibl supplies the typed information architecture, documentation shell, MDX components, search, themes, and human- and agent-readable outputs.

The package is intentionally a library rather than a framework. There is no wrapper around `next dev`, no generated application, and no private content runtime.

## Status

The published package is moving toward `0.2.0`, which refines the default visual shell around the production design it was extracted from.

## Run the Sibl docs

```bash
bun install
bun run dev
```

Open [http://localhost:3000/docs](http://localhost:3000/docs).

The documentation site in `apps/www/` is the canonical integration example: it
uses the local `@sibl/docs` workspace package to render and publish
Sibl's own MDX documentation.

Set `NEXT_PUBLIC_SITE_URL` to the deployed origin to emit absolute canonical
links in the sitemap and agent-readable outputs.

## Install

```bash
bun add @sibl/docs @next/mdx @mdx-js/loader @mdx-js/react
```

Import the visual system and pre-paint theme bootstrap once from your root layout:

```tsx
import { DocsThemeScript } from "@sibl/docs/react";
import "@sibl/docs/styles.css";
import config from "@/sibl.config";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DocsThemeScript storageKey={config.theme.storageKey} />
        {children}
      </body>
    </html>
  );
}
```

`suppressHydrationWarning` accounts for the theme class applied before React hydrates.

## Configure MDX

Sibl exposes serializable MDX options with GFM, stable heading IDs, and dual-theme Shiki highlighting. The Next integration stays visible in the application:

```ts
// next.config.ts
import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { createMdxOptions } from "@sibl/docs/mdx-config";

const withMDX = createMDX({ options: createMdxOptions() });

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

export default withMDX(nextConfig);
```

Connect Sibl's default MDX elements through Next's ordinary provider file:

```tsx
// mdx-components.tsx
import type { MDXComponents } from "mdx/types";
import { createMdxComponents } from "@sibl/docs/mdx";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createMdxComponents(components);
}
```

Pass overrides to `createMdxComponents` to replace any HTML element or add application components.

## Define the documentation

Every public page maps to an explicit source file. The manifest controls navigation and metadata without taking content compilation away from Next.js.

```ts
// sibl.config.ts
import { defineDocs } from "@sibl/docs";

export default defineDocs({
  title: "Acme",
  description: "Documentation for the Acme SDK.",
  basePath: "/docs",
  siteUrl: "https://docs.example.com",
  navigation: [
    {
      label: "Guide",
      items: [
        {
          title: "Introduction",
          slug: "",
          source: "content/docs/index.mdx",
        },
        {
          title: "Installation",
          slug: "installation",
          source: "content/docs/installation.mdx",
        },
      ],
    },
  ],
});
```

Create the server-side documentation model:

```ts
// lib/docs.ts
import { createDocs } from "@sibl/docs/server";
import config from "@/sibl.config";

export const docs = createDocs(config, { rootDir: process.cwd() });
```

## Render compiled MDX

MDX imports remain static and inspectable. A catch-all route can use a small content registry:

```ts
// lib/content.ts
import Introduction from "@/content/docs/index.mdx";
import Installation from "@/content/docs/installation.mdx";

export const content = {
  "": Introduction,
  installation: Installation,
};
```

```tsx
// app/docs/[[...slug]]/page.tsx
import { notFound } from "next/navigation";
import { DocsPage } from "@sibl/docs/react";
import { content } from "@/lib/content";
import { docs } from "@/lib/docs";

export function generateStaticParams() {
  return docs.generateStaticParams();
}

export default async function Page({ params }) {
  const page = docs.getPage((await params).slug);
  if (!page) notFound();

  const Content = content[page.slug];
  if (!Content) notFound();

  return (
    <DocsPage config={docs.config} page={page}>
      <Content />
    </DocsPage>
  );
}
```

`DocsPage` is only a convenience composition and expects the MDX source to own its `# Title`. `DocsPageWithHeader` is the explicit manifest-rendered heading variant. Applications can independently use `DocsLayout`, `DocsArticle`, `DocsPageHeader`, `DocsPagination`, `DocsNavigation`, and `DocsTableOfContents`. The layout accepts custom brand, action, sidebar footer, and footer slots.

### Preserve an existing product theme

Sibl's stylesheet consumes semantic theme variables: `--color-bg`, `--color-surface`, `--color-surface-muted`, `--color-ink`, `--color-ink-light`, `--color-ink-muted`, `--color-border`, `--color-accent-strong`, and `--color-code-bg`. Existing values continue to control the shell after migration. The manifest supplies the light and dark accent colors, while the `brand`, `sidebarFooter`, and `footer` slots keep product-specific identity in the application.

## Outputs

The server model exposes:

```ts
await docs.getSearchIndex();
await docs.getLlmsText();
await docs.getLlmsFullText();
await docs.writeOutputs({ outputDir: "public" });
```

Use route handlers when the Next deployment can generate them, or `writeOutputs` before a static export. Search entries are generated for individual second- and third-level headings, not only whole pages.

## Package exports

- `@sibl/docs` — configuration, navigation, and search primitives
- `@sibl/docs/server` — source validation and generated outputs
- `@sibl/docs/react` — composable documentation UI
- `@sibl/docs/mdx` — default MDX components and `Callout`
- `@sibl/docs/mdx-config` — serializable Next MDX compiler options
- `@sibl/docs/styles.css` — default responsive light/dark visual system

## Development

The root scripts use Turborepo to order workspace dependencies and cache task
outputs locally.

```bash
bun run check
bun run format
```

Public package changes use Changesets. Add a release note with the
implementation:

```bash
bun run changeset
```

To prepare and publish a local release from a clean `main` branch:

```bash
bun run version-packages
# Review and commit the version and changelog changes.
bun run release
git push --follow-tags
```

See [`.changeset/README.md`](.changeset/README.md) for the complete workflow.

## License

MIT
