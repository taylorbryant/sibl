export interface SearchEntry {
  route: string;
  pageTitle: string;
  sectionLabel: string;
  heading: string;
  headingId: string;
  body: string;
}

export interface SearchResult {
  entry: SearchEntry;
  score: number;
  snippet: string;
}

export const MAX_SEARCH_RESULTS = 12;

const FIELD_WEIGHTS = {
  heading: 10,
  pageTitle: 8,
  sectionLabel: 3,
  body: 1.2,
} as const;

export function tokenizeSearch(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
}

function isWordChar(char: string | undefined): boolean {
  return char !== undefined && /[a-z0-9]/i.test(char);
}

function matchQuality(field: string, term: string): number {
  const index = field.indexOf(term);
  if (index < 0) return 0;
  if (field === term) return 4;
  if (index === 0) return 3;
  if (!isWordChar(field[index - 1])) return 2.4;
  return 1.2;
}

function scoreEntry(entry: SearchEntry, terms: string[]): number {
  const fields = {
    heading: entry.heading.toLowerCase(),
    pageTitle: entry.pageTitle.toLowerCase(),
    sectionLabel: entry.sectionLabel.toLowerCase(),
    body: entry.body.toLowerCase(),
  };
  let total = 0;

  for (const term of terms) {
    const best = Math.max(
      FIELD_WEIGHTS.heading * matchQuality(fields.heading, term),
      FIELD_WEIGHTS.pageTitle * matchQuality(fields.pageTitle, term),
      FIELD_WEIGHTS.sectionLabel * matchQuality(fields.sectionLabel, term),
      FIELD_WEIGHTS.body * matchQuality(fields.body, term),
    );
    if (best === 0) return 0;
    total += best;
  }

  return entry.headingId === "" ? total * 1.15 : total;
}

export function makeSearchSnippet(body: string, terms: string[]): string {
  const maximumLength = 150;
  const lower = body.toLowerCase();
  let matchIndex = -1;

  for (const term of terms) {
    const index = lower.indexOf(term);
    if (index >= 0 && (matchIndex < 0 || index < matchIndex)) matchIndex = index;
  }

  let start = matchIndex < 0 ? 0 : Math.max(0, matchIndex - 42);
  if (start > 0) {
    const nextSpace = body.indexOf(" ", start);
    if (nextSpace >= 0 && nextSpace < matchIndex) start = nextSpace + 1;
  }
  const end = Math.min(body.length, start + maximumLength);
  return `${start > 0 ? "…" : ""}${body.slice(start, end).trim()}${end < body.length ? "…" : ""}`;
}

export function searchDocs(
  entries: SearchEntry[],
  query: string,
): SearchResult[] {
  const terms = tokenizeSearch(query);
  if (terms.length === 0) {
    return entries
      .filter((entry) => entry.headingId === "")
      .slice(0, 6)
      .map((entry) => ({
        entry,
        score: 0,
        snippet: makeSearchSnippet(entry.body, []),
      }));
  }

  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, terms), snippet: "" }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_SEARCH_RESULTS)
    .map((result) => ({
      ...result,
      snippet: makeSearchSnippet(result.entry.body, terms),
    }));
}
