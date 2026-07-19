# Changesets

Changesets records release intent for `@sibl/docs`. The private documentation
app is not versioned or published.

## Add a changeset

Run this whenever a change affects the public package:

```bash
bun run changeset
```

Select `@sibl/docs`, choose the SemVer bump, and describe the user-facing
change. Commit the generated Markdown file with the implementation.

## Prepare a release

From a clean `main` branch, consume all pending changesets:

```bash
bun run version-packages
```

This updates the package version and changelog, removes the consumed changeset
files, and refreshes `bun.lock`. Review and commit those generated changes
before publishing.

## Publish locally

```bash
npm login
bun run release
git push --follow-tags
```

The release command verifies the workspaces, publishes every unpublished
public package, and creates the corresponding Git tag. It disables npm
provenance for the local publish because provenance requires a supported CI
environment. The package keeps provenance enabled in `publishConfig` for a
future automated release workflow.

The first pending minor changeset prepares `@sibl/docs` `0.2.0`. Running
`bun run version-packages` will generate that version and its changelog.
