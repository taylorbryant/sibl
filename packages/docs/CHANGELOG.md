# @sibl/docs

## 0.3.0

### Minor Changes

- c74bff7: Simplify the canonical setup around an explicit `Docs` model: `createDocs`
  now defaults to the current working directory, content registries attach through
  `docs.defineContent`, and page metadata uses the unambiguous
  `DocsPageDescriptor` type.

  Rename documentation and application paths to `docsPath` and `appBasePath`,
  and group theme accents and backgrounds into light/dark color pairs.

  Add `createDocsViewport` and theme-object props for the browser theme bootstrap
  and toggle, and remove undocumented raw-source and Markdown parser exports from
  the server API. Ensure mutable config defaults are isolated between calls.

### Patch Changes

- 4ecb803: Keep heading text as plain text and expose deep links through a separate,
  accessible permalink control.

  Give every fenced code block a persistent header with a readable language
  label and copy button.

  Match callout title spacing to the shared documentation layout.

  Increase blockquote contrast in light and dark themes.

  Validate static MDX registries and internal documentation links during builds,
  including heading fragments with stable duplicate IDs.

  Support Next.js deployments below an origin path for search and generated
  agent URLs and root-relative MDX images without changing the location of
  written static files.

  Remove native JSX markup from agent-readable output while preserving prose and
  inline code, and keep CSS-rendered permalinks out of table-of-contents labels.

  Keep supported browser chrome in sync with the active documentation theme and
  expose light and dark background colors through the typed theme config.

## 0.2.1

### Patch Changes

- Render search input focus as one intentional ring around the complete search
  field instead of overlapping outlines around its inner controls.

## 0.2.0

### Minor Changes

- Add a composable, responsive documentation shell with configurable brand,
  actions, navigation, table of contents, pagination, and footer slots.

  Add semantic theme tokens for preserving an application's visual identity and
  explicit page compositions for source-owned and manifest-owned headings.
