# Sibl

Sibl is a composable, Next-native documentation library built from a shared production documentation architecture. Next.js compiles and routes the MDX; Sibl supplies the typed information architecture, documentation shell, MDX components, search, themes, and human- and agent-readable outputs.

The package is intentionally a library rather than a framework. There is no wrapper around `next dev`, no generated application, and no private content runtime.

## Status

Sibl is pre-1.0 and ready for incremental adoption in existing Next.js documentation sites. Its explicit config, MDX registry, and content validation are designed to make migrations fail at build time instead of producing partial sites.

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

If the application is deployed below an origin path, set
`NEXT_PUBLIC_BASE_PATH` (for example, `/preview`) as well. The canonical app
passes the same value to Next.js `basePath` and Sibl `deploymentBasePath`.

To exercise the same integration as a prefixed static export, run:

```bash
SIBL_STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/preview bun run build:docs
```

## Install

```bash
bun add @sibl/docs @next/mdx @mdx-js/loader @mdx-js/react
```

Import the visual system and pre-paint theme bootstrap once from your root layout:

```tsx
import { DocsThemeScript } from "@sibl/docs/react";
import "@sibl/docs/styles.css";
import config from "@/sibl.config";

export const viewport = {
  themeColor: [
    {
      color: config.theme.background,
      media: "(prefers-color-scheme: light)",
    },
    {
      color: config.theme.backgroundDark,
      media: "(prefers-color-scheme: dark)",
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DocsThemeScript
          darkColor={config.theme.backgroundDark}
          lightColor={config.theme.background}
          storageKey={config.theme.storageKey}
        />
        {children}
      </body>
    </html>
  );
}
```

`suppressHydrationWarning` accounts for the theme class applied before React hydrates. The viewport colors give browser chrome a correct system-theme fallback, while `DocsThemeScript` updates them before hydration when the stored Sibl theme overrides the system preference.

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

Pass any bundled Shiki theme names to replace the defaults:

```ts
const withMDX = createMDX({
  options: createMdxOptions({
    themes: {
      light: "vitesse-light",
      dark: "vitesse-dark",
    },
  }),
});
```

Connect Sibl's default MDX elements through Next's ordinary provider file:

```tsx
// mdx-components.tsx
import type { MDXComponents } from "mdx/types";
import { createMdxComponents } from "@sibl/docs/mdx";
import config from "@/sibl.config";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createMdxComponents(components, { config });
}
```

Pass overrides to `createMdxComponents` to replace any HTML element or add application components. Supplying the config also prefixes root-relative MDX image URLs for path-based deployments.

## Define the documentation

Every public page maps to an explicit source file. The manifest controls navigation and metadata without taking content compilation away from Next.js.

```ts
// sibl.config.ts
import { defineDocs } from "@sibl/docs";

export default defineDocs({
  title: "Acme",
  description: "Documentation for the Acme SDK.",
  basePath: "/docs",
  deploymentBasePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
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
import type { ComponentType } from "react";
import { defineDocsContent } from "@sibl/docs/server";
import Introduction from "@/content/docs/index.mdx";
import Installation from "@/content/docs/installation.mdx";
import { docs } from "@/lib/docs";

export const content: Record<string, ComponentType> = defineDocsContent(
  docs,
  {
    "": Introduction,
    installation: Installation,
  },
);
```

```tsx
// app/docs/[[...slug]]/page.tsx
import { notFound } from "next/navigation";
import { DocsPage } from "@sibl/docs/react";
import { content } from "@/lib/content";
import { docs } from "@/lib/docs";

export async function generateStaticParams() {
  await docs.validate();
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

`defineDocsContent` requires the static import registry to exactly match the
manifest. `docs.validate()` checks that every source exists and that internal
documentation links and heading fragments resolve. Calling it from
`generateStaticParams` makes those checks part of `next build`.

### Deploy below an origin path

Keep documentation routing and deployment routing separate. `basePath`
chooses where docs live inside the application; `deploymentBasePath` mirrors
Next.js `basePath` when the entire application is hosted below a path:

```ts
// next.config.ts
const deploymentBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
  /\/+$/,
  "",
);

const nextConfig = {
  basePath: deploymentBasePath || undefined,
};
```

Sibl leaves Next `<Link>` destinations unprefixed so Next can handle them, and
prefixes browser-fetched search data plus canonical agent-output URLs. Static
output files are still written relative to the selected output directory.

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
