# Sibl

Sibl is a composable, Next-native documentation library extracted from the shared architecture of the Tenchi and Beignet documentation sites. Next.js compiles and routes the MDX; Sibl supplies the typed information architecture, documentation shell, MDX components, search, themes, and human- and agent-readable outputs.

The package is intentionally a library rather than a framework. There is no wrapper around `next dev`, no generated application, and no private content runtime.

## Status

This repository contains the `0.1.0` release candidate. It has not been published to npm yet.

## Run the example

```bash
bun install
bun run dev
```

Open [http://localhost:3000/docs](http://localhost:3000/docs).

## Install

```bash
bun add sibl @next/mdx @mdx-js/loader @mdx-js/react
```

Import the visual system and pre-paint theme bootstrap once from your root layout:

```tsx
import { DocsThemeScript } from "sibl/react";
import "sibl/styles.css";
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
import { createMdxOptions } from "sibl/mdx-config";

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
import { createMdxComponents } from "sibl/mdx";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createMdxComponents(components);
}
```

Pass overrides to `createMdxComponents` to replace any HTML element or add application components.

## Define the documentation

Every public page maps to an explicit source file. The manifest controls navigation and metadata without taking content compilation away from Next.js.

```ts
// sibl.config.ts
import { defineDocs } from "sibl";

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
import { createDocs } from "sibl/server";
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
import { DocsPage } from "sibl/react";
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

`DocsPage` is only a convenience composition. Applications can independently use `DocsLayout`, `DocsArticle`, `DocsPageHeader`, `DocsPagination`, `DocsNavigation`, and `DocsTableOfContents`. The layout accepts custom brand, header action, sidebar footer, and footer slots.

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

- `sibl` — configuration, navigation, and search primitives
- `sibl/server` — source validation and generated outputs
- `sibl/react` — composable documentation UI
- `sibl/mdx` — default MDX components and `Callout`
- `sibl/mdx-config` — serializable Next MDX compiler options
- `sibl/styles.css` — default responsive light/dark visual system

## Development

```bash
bun run typecheck
bun test
bun run build
```

## License

MIT
