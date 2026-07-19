import { defineDocs } from "sibl";

export default defineDocs({
  title: "Sibl",
  description:
    "Explicit, Next-native documentation primitives for people and agents.",
  basePath: "/docs",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  navigation: [
    {
      label: "Getting started",
      items: [
        {
          title: "What is Sibl?",
          slug: "",
          source: "content/docs/index.mdx",
          eyebrow: "Documentation infrastructure",
          description:
            "A small documentation layer that keeps routing, content, and output visible.",
        },
        {
          title: "Installation",
          slug: "installation",
          source: "content/docs/installation.mdx",
          eyebrow: "Getting started",
          description: "Add Sibl to an existing Next.js application.",
        },
        {
          title: "Architecture",
          slug: "architecture",
          source: "content/docs/architecture.mdx",
          eyebrow: "Design",
          description:
            "Understand what Sibl owns—and what it deliberately leaves to Next.js.",
        },
      ],
    },
    {
      label: "Reference",
      items: [
        {
          title: "Configuration",
          slug: "configuration",
          source: "content/docs/configuration.mdx",
          eyebrow: "Reference",
          description:
            "Define navigation and project metadata in one typed manifest.",
        },
        {
          title: "Agent outputs",
          slug: "agent-outputs",
          source: "content/docs/agent-outputs.mdx",
          eyebrow: "Agents and search",
          description:
            "Publish the same documentation corpus for humans, search, and agents.",
          badge: "AI",
        },
      ],
    },
  ],
  links: [{ label: "llms.txt", href: "/llms.txt" }],
  theme: {
    accent: "#6658d3",
    accentDark: "#9b91ff",
    mark: "§",
    storageKey: "sibl-docs-theme",
  },
});
