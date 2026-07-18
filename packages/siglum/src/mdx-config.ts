import type createMDX from "@next/mdx";

export interface CreateMdxOptions {
  themes?: {
    dark: string | Record<string, unknown>;
    light: string | Record<string, unknown>;
  };
}

type NextMdxConfig = NonNullable<Parameters<typeof createMDX>[0]>;
export type MdxProcessorOptions = NonNullable<NextMdxConfig["options"]>;

export function createMdxOptions(
  options: CreateMdxOptions = {},
): MdxProcessorOptions {
  return {
    remarkPlugins: ["siglum/remark-gfm"],
    rehypePlugins: [
      "siglum/rehype-slug",
      [
        "siglum/rehype-shiki",
        {
          addLanguageClass: true,
          themes: options.themes ?? {
            light: "github-light",
            dark: "github-dark",
          },
        },
      ],
    ],
  } as MdxProcessorOptions;
}
