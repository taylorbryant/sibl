---
"@sibl/docs": minor
---

Simplify the canonical setup around an explicit `Docs` model: `createDocs`
now defaults to the current working directory, content registries attach through
`docs.defineContent`, and page metadata uses the unambiguous
`DocsPageDescriptor` type.

Rename documentation and application paths to `docsPath` and `appBasePath`,
and group theme accents and backgrounds into light/dark color pairs.

Add `createDocsViewport` and theme-object props for the browser theme bootstrap
and toggle, and remove undocumented raw-source and Markdown parser exports from
the server API. Ensure mutable config defaults are isolated between calls.
