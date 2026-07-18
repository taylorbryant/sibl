# Siglum

Siglum is an experimental, Next-native documentation library for people and agents. It turns one explicit manifest and a directory of Markdown files into a documentation UI, a search index, `llms.txt`, and a full-text agent corpus.

The package is intentionally small. Next.js continues to own routing, rendering, caching, and deployment; Siglum owns the documentation model and its default presentation.

## Status

This repository contains the initial working version. The package is not published yet and its API should be considered pre-release.

## Quick start

Install the workspace and launch the included example:

```bash
bun install
bun run dev
```

Then open [http://localhost:3000/docs](http://localhost:3000/docs).

Define the documentation in `siglum.config.ts`:

```ts
import { defineDocs } from "siglum";

export default defineDocs({
  title: "Acme",
  description: "Documentation for the Acme SDK.",
  navigation: [
    {
      label: "Guide",
      items: [
        { title: "Introduction", slug: "" },
        { title: "Installation", slug: "installation" },
      ],
    },
  ],
});
```

Connect it to the content directory:

```ts
import { createDocs } from "siglum/server";
import config from "./siglum.config";

export const docs = createDocs(config, { rootDir: process.cwd() });
```

Render a page from an ordinary App Router route:

```tsx
import { notFound } from "next/navigation";
import { DocsPageView } from "siglum/react";
import { docs } from "@/lib/docs";

export default async function Page({ params }) {
  const { slug } = await params;
  const page = await docs.getPage(slug);

  if (!page) notFound();
  return <DocsPageView config={docs.config} page={page} />;
}
```

The complete integration, including static params, metadata, sitemap, and agent routes, lives in [`examples/basic`](./examples/basic).

Set `siteUrl` in the manifest before deploying so `llms.txt` and sitemap entries use the production origin.

## Public API

- `siglum` — typed configuration and navigation helpers
- `siglum/server` — Markdown loading and generated outputs
- `siglum/react` — the default Server Component-compatible documentation page
- `siglum/styles.css` — the default visual system

## Repository layout

```text
packages/siglum   Library source and tests
examples/basic    Runnable Next.js App Router example
```

## Development

```bash
bun run typecheck
bun test
bun run build
```

## License

MIT
