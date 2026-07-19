import GithubSlugger from "github-slugger";

export interface DocsHeading {
  depth: 2 | 3;
  id: string;
  text: string;
}

function cleanInlineMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function slugifyHeading(value: string): string {
  return new GithubSlugger().slug(cleanInlineMarkdown(value));
}

export function extractHeadings(markdown: string): DocsHeading[] {
  const headings: DocsHeading[] = [];
  const slugger = new GithubSlugger();
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const text = cleanInlineMarkdown(match[2] ?? "");
    headings.push({
      depth: (match[1]?.length ?? 2) as 2 | 3,
      id: slugger.slug(text),
      text,
    });
  }

  return headings;
}

export function cleanMdx(source: string): string {
  const output: string[] = [];
  let inFence = false;
  let inComponentTag = false;
  let skippingModuleStatement = false;

  for (const line of source.replace(/^\uFEFF/, "").split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      output.push(line);
      continue;
    }
    if (inFence) {
      output.push(line);
      continue;
    }

    if (skippingModuleStatement) {
      if (/;\s*$/.test(line)) skippingModuleStatement = false;
      continue;
    }
    if (/^\s*(import|export)\s/.test(line)) {
      if (!/;\s*$/.test(line)) skippingModuleStatement = true;
      continue;
    }

    let cleaned = line;
    if (inComponentTag) {
      const close = cleaned.indexOf(">");
      if (close < 0) continue;
      cleaned = cleaned.slice(close + 1);
      inComponentTag = false;
    }

    while (true) {
      const open = cleaned.search(/<\/?[A-Z]/);
      if (open < 0) break;
      const close = cleaned.indexOf(">", open);
      if (close < 0) {
        cleaned = cleaned.slice(0, open);
        inComponentTag = true;
        break;
      }
      cleaned = `${cleaned.slice(0, open)} ${cleaned.slice(close + 1)}`;
    }

    output.push(cleaned.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ").trimEnd());
  }

  return output
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stripMarkdown(markdown: string): string {
  return cleanMdx(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[`*_~|]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}
