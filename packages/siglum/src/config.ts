import { z } from "zod";

const slugPattern = /^(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$|^$/;
const hexColorPattern = /^#[0-9a-f]{6}$/i;

const navigationItemSchema = z
  .object({
    title: z.string().trim().min(1),
    slug: z.string().regex(slugPattern, {
      message: "Use lowercase URL segments separated by slashes",
    }),
    description: z.string().trim().min(1).optional(),
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
    contentDir: z
      .string()
      .trim()
      .min(1)
      .refine(
        (value) =>
          !value.startsWith("/") &&
          !value.startsWith("~") &&
          !value.split(/[\\/]/).includes(".."),
        "contentDir must be a relative path inside the project",
      )
      .default("content/docs"),
    siteUrl: z.string().url().optional(),
    navigation: z.array(navigationSectionSchema).min(1),
    links: z.array(linkSchema).default([]),
    theme: z
      .object({
        accent: z.string().regex(hexColorPattern).default("#6658d3"),
        mark: z.string().trim().min(1).max(3).default("§"),
      })
      .strict()
      .default({ accent: "#6658d3", mark: "§" }),
  })
  .strict()
  .superRefine((config, context) => {
    const seen = new Set<string>();

    for (const section of config.navigation) {
      for (const item of section.items) {
        if (seen.has(item.slug)) {
          context.addIssue({
            code: "custom",
            message: `Duplicate documentation slug: ${item.slug || "<root>"}`,
            path: ["navigation"],
          });
        }
        seen.add(item.slug);
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
