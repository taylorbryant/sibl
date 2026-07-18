---
eyebrow: Documentation infrastructure
---

Siglum is a small set of primitives for building documentation inside a Next.js application. It turns an explicit manifest and ordinary Markdown files into a polished site without taking ownership of the framework underneath it.

> Siglum is intentionally a library, not a hosted platform. Your routes are Next routes, your pages are files, and the generated outputs remain inspectable.

## One corpus, several readers

Documentation now has more than one audience. A person wants deliberate navigation and readable typography. Search needs a compact index. An agent needs stable, plain-text context.

Siglum derives each representation from the same source:

- a navigable React documentation surface;
- a JSON search index;
- a concise `llms.txt` map; and
- a complete `llms-full.txt` corpus.

## A visible integration

The entire content model begins in `siglum.config.ts`:

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

There is no directory convention pretending to be invisible configuration. If a page appears in the navigation, it appears in the manifest.

## Current scope

This first version deliberately stays narrow.

| Siglum owns | Next.js owns |
| --- | --- |
| Documentation config | Routing |
| Markdown loading | Rendering lifecycle |
| Navigation and pagination | Deployment |
| Human and agent outputs | Caching strategy |
| The default documentation UI | Application composition |

That boundary keeps the package useful without turning it into another framework inside your framework.
