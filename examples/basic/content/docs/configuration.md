---
eyebrow: Reference
---

The config is both a runtime-validated object and the source of the public navigation hierarchy.

## Project fields

| Field | Default | Purpose |
| --- | --- | --- |
| `title` | required | Product or project name |
| `description` | required | Site and agent-output summary |
| `basePath` | `/docs` | Route prefix for documentation |
| `contentDir` | `content/docs` | Markdown directory, relative to the app |
| `siteUrl` | — | Optional origin for absolute agent links |
| `links` | `[]` | Small project links in the header |
| `theme` | Siglum defaults | Accent color and identifying mark |

## Navigation sections

Each section has a label and one or more page entries. A page entry contains a human title and a normalized slug.

```ts
{
  label: "Reference",
  items: [
    {
      title: "Configuration",
      slug: "configuration",
      description: "Every supported configuration field.",
      badge: "API",
    },
  ],
}
```

Slugs use lowercase URL segments such as `guides/deployment`. The root documentation page uses an empty slug.

## Page frontmatter

Markdown frontmatter stays intentionally small. The title belongs to the manifest so navigation and metadata cannot drift apart.

```yaml
---
description: A page-specific description that overrides the manifest summary.
eyebrow: Reference
---
```

Unknown frontmatter is preserved for future integrations, while Siglum currently reads `description` and `eyebrow`.
