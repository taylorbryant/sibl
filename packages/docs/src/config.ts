import { z } from "zod";

const slugPattern =
  /^(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$|^$/;
const hexColorPattern = /^#[0-9a-f]{6}$/i;
const routePathPattern = /^\/[a-z0-9./_-]+$/;

const safeRelativePath = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) =>
      !value.startsWith("/") &&
      !value.startsWith("~") &&
      !value.split(/[\\/]/).includes(".."),
    "source must be a relative path inside the project",
  )
  .refine(
    (value) => /\.mdx?$/.test(value),
    "source must point to a .md or .mdx file",
  );

const navigationItemSchema = z
  .object({
    title: z.string().trim().min(1),
    slug: z.string().regex(slugPattern, {
      message: "Use lowercase URL segments separated by slashes",
    }),
    source: safeRelativePath,
    description: z.string().trim().min(1).optional(),
    eyebrow: z.string().trim().min(1).optional(),
    navLabel: z.string().trim().min(1).optional(),
    badge: z.string().trim().min(1).optional(),
  })
  .strict();

const navigationSectionSchema = z
  .object({
    label: z.string().trim().min(1),
    items: z.array(navigationItemSchema).min(1),
  })
  .strict();

const linkSchema = z
  .object({
    label: z.string().trim().min(1),
    href: z.string().trim().min(1),
  })
  .strict();

const outputPath = z
  .string()
  .regex(routePathPattern, {
    message: "Output paths must be absolute URL paths",
  })
  .refine(
    (value) => !value.split("/").includes(".."),
    "Output paths cannot traverse outside the output directory",
  );

export const docsConfigSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    basePath: z
      .string()
      .regex(/^\/[a-z0-9/-]*$/, {
        message: "basePath must start with / and use lowercase URL segments",
      })
      .transform((value) => {
        if (value === "/") return value;
        return value.replace(/\/+$/, "");
      })
      .default("/docs"),
    deploymentBasePath: z
      .string()
      .regex(/^(?:|\/[a-z0-9/-]*)$/, {
        message:
          "deploymentBasePath must be empty or start with / and use lowercase URL segments",
      })
      .transform((value) => {
        if (value === "" || value === "/") return "";
        return value.replace(/\/+$/, "");
      })
      .default(""),
    siteUrl: z.string().url().optional(),
    navigation: z.array(navigationSectionSchema).min(1),
    links: z.array(linkSchema).default([]),
    outputs: z
      .object({
        llms: outputPath.default("/llms.txt"),
        llmsFull: outputPath.default("/llms-full.txt"),
        searchIndex: outputPath.default("/search-index.json"),
      })
      .strict()
      .default({
        llms: "/llms.txt",
        llmsFull: "/llms-full.txt",
        searchIndex: "/search-index.json",
      }),
    search: z
      .object({
        enabled: z.boolean().default(true),
        placeholder: z.string().trim().min(1).default("Search documentation…"),
      })
      .strict()
      .default({ enabled: true, placeholder: "Search documentation…" }),
    theme: z
      .object({
        accent: z.string().regex(hexColorPattern).default("#4f46e5"),
        accentDark: z.string().regex(hexColorPattern).default("#bd93f9"),
        background: z.string().regex(hexColorPattern).default("#ffffff"),
        backgroundDark: z.string().regex(hexColorPattern).default("#282a36"),
        mark: z.string().trim().min(1).max(3).default("§"),
        storageKey: z
          .string()
          .trim()
          .regex(/^[a-zA-Z0-9._:-]+$/, {
            message:
              "theme.storageKey may only contain letters, numbers, ., _, :, and -",
          })
          .default("sibl-theme"),
      })
      .strict()
      .default({
        accent: "#4f46e5",
        accentDark: "#bd93f9",
        background: "#ffffff",
        backgroundDark: "#282a36",
        mark: "§",
        storageKey: "sibl-theme",
      }),
  })
  .strict()
  .superRefine((config, context) => {
    const slugs = new Set<string>();
    const sources = new Set<string>();

    for (const section of config.navigation) {
      for (const item of section.items) {
        if (slugs.has(item.slug)) {
          context.addIssue({
            code: "custom",
            message: `Duplicate documentation slug: ${item.slug || "<root>"}`,
            path: ["navigation"],
          });
        }
        if (sources.has(item.source)) {
          context.addIssue({
            code: "custom",
            message: `Duplicate documentation source: ${item.source}`,
            path: ["navigation"],
          });
        }
        slugs.add(item.slug);
        sources.add(item.source);
      }
    }
  });

export type NavigationItem = z.infer<typeof navigationItemSchema>;
export type NavigationSection = z.infer<typeof navigationSectionSchema>;
export type DocsConfig = z.output<typeof docsConfigSchema>;
export type DocsConfigInput = z.input<typeof docsConfigSchema>;

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends Array<infer Item>
    ? ReadonlyArray<DeepReadonly<Item>>
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export function defineDocs<const T extends DeepReadonly<DocsConfigInput>>(
  config: T,
): DocsConfig {
  return docsConfigSchema.parse(config);
}
