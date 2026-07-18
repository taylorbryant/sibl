---
eyebrow: Agents and search
---

Siglum treats agent-readable documentation as a build product of the same source—not a second body of content to maintain.

## llms.txt

`docs.getLlmsText()` produces a compact map of the documentation corpus. It keeps section order, page summaries, and canonical links from the manifest.

```ts
export async function GET() {
  return new Response(await docs.getLlmsText(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
```

This example publishes that output at [`/llms.txt`](/llms.txt).

## Full-text context

`docs.getLlmsFullText()` concatenates the Markdown corpus with page titles and sources. It is useful when a tool needs the actual documentation rather than an index.

The example exposes it at [`/llms-full.txt`](/llms-full.txt).

## Search index

`docs.getSearchIndex()` produces a stable JSON array with titles, descriptions, sections, links, and normalized text. Applications can use it directly for a small client search or upload it to a hosted index.

```json
{
  "id": "configuration",
  "title": "Configuration",
  "section": "Reference",
  "href": "/docs/configuration",
  "content": "The config is both a runtime-validated object..."
}
```

The example publishes the complete array at [`/search-index.json`](/search-index.json).

## Why generate all three?

Each output is cheap because it shares the manifest and Markdown loader. More importantly, every reader sees the same ordering, titles, descriptions, and URLs. The representations cannot quietly drift into separate products.
