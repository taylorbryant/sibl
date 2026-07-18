---
eyebrow: Getting started
---

Siglum is designed to enter an existing App Router project as an ordinary dependency.

## Install the package

```bash
bun add siglum
```

Import the default stylesheet once from the root layout:

```tsx
import "siglum/styles.css";
```

## Create the manifest

Add `siglum.config.ts` at the application root. Navigation is explicit and ordered, so the configuration is also the table of contents.

```ts
import { defineDocs } from "siglum";

export default defineDocs({
  title: "Acme",
  description: "Build with the Acme API.",
  contentDir: "content/docs",
  navigation: [
    {
      label: "Start here",
      items: [{ title: "Overview", slug: "" }],
    },
  ],
});
```

## Connect the source

Create one small server-only module. Siglum resolves content relative to the project root and reads files lazily, which keeps local editing predictable.

```ts
import { createDocs } from "siglum/server";
import config from "./siglum.config";

export const docs = createDocs(config, {
  rootDir: process.cwd(),
});
```

The example repository contains the complete catch-all route. Nothing is generated into the application and every integration point remains editable.
