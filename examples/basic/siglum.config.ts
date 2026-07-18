import { defineDocs } from "siglum";

export default defineDocs({
  title: "Siglum",
  description:
    "Explicit, Next-native documentation primitives for people and agents.",
  basePath: "/docs",
  contentDir: "docs",
  navigation: [
    {
      label: "Getting started",
      items: [
        {
          title: "What is Siglum?",
          slug: "",
          description:
            "A small documentation layer that keeps routing, content, and output visible.",
        },
        {
          title: "Installation",
          slug: "installation",
          description: "Add Siglum to an existing Next.js application.",
        },
        {
          title: "Architecture",
          slug: "architecture",
          description: "Understand what Siglum owns—and what it deliberately leaves to Next.js.",
        },
      ],
    },
    {
      label: "Reference",
      items: [
        {
          title: "Configuration",
          slug: "configuration",
          description: "Define navigation and project metadata in one typed manifest.",
        },
        {
          title: "Agent outputs",
          slug: "agent-outputs",
          description: "Publish the same documentation corpus for humans, search, and agents.",
          badge: "AI",
        },
      ],
    },
  ],
  links: [{ label: "llms.txt", href: "/llms.txt" }],
  theme: {
    accent: "#6658d3",
    mark: "§",
  },
});
