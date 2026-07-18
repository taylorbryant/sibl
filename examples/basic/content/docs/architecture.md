---
eyebrow: Design
---

Siglum separates the documentation problem into three small layers. Applications can adopt all three or replace the presentation layer while keeping the content model.

## The typed manifest

`defineDocs` validates project metadata, navigation, slugs, links, and theme tokens. Duplicate slugs fail immediately instead of producing ambiguous routes.

The manifest is deliberately more explicit than filesystem-derived navigation. Moving a file should not silently reorganize a public information architecture.

## The content source

`createDocs` connects manifest entries to Markdown on disk. It exposes small asynchronous methods:

```ts
await docs.getPage(["installation"]);
await docs.getPages();
await docs.getSearchIndex();
await docs.getLlmsText();
```

Files may use either `installation.md` or `installation/index.md`. The empty slug resolves to `index.md`.

## The React surface

`DocsPageView` is a Server Component-compatible renderer. It ships navigation, typography, tables, code blocks, responsive behavior, a table of contents, and previous/next links without requiring client-side JavaScript.

Because the loaded page is ordinary data, an application can replace this renderer with its own components at any point.

## The framework boundary

Siglum does not wrap `next dev`, hide route files, or invent a deployment pipeline. This is an architectural constraint, not a missing feature: the application should keep access to the framework it chose.
