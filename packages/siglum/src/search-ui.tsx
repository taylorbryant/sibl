"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  searchDocs,
  tokenizeSearch,
  type SearchEntry,
  type SearchResult,
} from "./search.js";

const indexRequests = new Map<string, Promise<SearchEntry[]>>();

function loadIndex(url: string): Promise<SearchEntry[]> {
  const existing = indexRequests.get(url);
  if (existing) return existing;

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Search index request failed: ${response.status}`);
      }
      return response.json() as Promise<SearchEntry[]>;
    })
    .catch((error) => {
      indexRequests.delete(url);
      throw error;
    });
  indexRequests.set(url, request);
  return request;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const pattern = useMemo(() => {
    if (terms.length === 0) return null;
    return new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  }, [terms]);

  if (!pattern) return <>{text}</>;
  return (
    <>
      {text.split(pattern).map((part, index) =>
        index % 2 === 1 ? <mark key={`${part}-${index}`}>{part}</mark> : part,
      )}
    </>
  );
}

function resultHref(result: SearchResult): string {
  return result.entry.headingId
    ? `${result.entry.route}#${result.entry.headingId}`
    : result.entry.route;
}

interface SearchDialogProps {
  indexUrl: string;
  onClose: () => void;
  placeholder: string;
}

function SearchDialog({ indexUrl, onClose, placeholder }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const terms = useMemo(() => tokenizeSearch(query), [query]);
  const results = useMemo(
    () => (entries ? searchDocs(entries, query) : []),
    [entries, query],
  );

  useEffect(() => {
    let cancelled = false;
    loadIndex(indexUrl)
      .then((loaded) => {
        if (!cancelled) setEntries(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelled = true;
      document.body.style.overflow = previousOverflow;
    };
  }, [indexUrl]);

  useEffect(() => {
    const option = listRef.current?.querySelector('[aria-selected="true"]');
    option?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function go(result: SearchResult) {
    onClose();
    router.push(resultHref(result));
  }

  function onKeyDown(event: ReactKeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const result = results[activeIndex] ?? results[0];
      if (result) go(result);
    }
  }

  let previousSection: string | null = null;

  return createPortal(
    <div
      className="siglum-search-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Search documentation"
        aria-modal="true"
        className="siglum-search-dialog"
        onKeyDown={onKeyDown}
      >
        <div className="siglum-search-field">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            aria-activedescendant={
              results.length > 0 ? `siglum-search-option-${activeIndex}` : undefined
            }
            aria-autocomplete="list"
            aria-controls="siglum-search-results"
            aria-expanded={results.length > 0}
            aria-label="Search documentation"
            autoComplete="off"
            placeholder={placeholder}
            role="combobox"
            spellCheck={false}
            type="search"
          />
          <button type="button" onClick={onClose} aria-label="Close search">
            esc
          </button>
        </div>

        <div
          ref={listRef}
          id="siglum-search-results"
          role="listbox"
          aria-label="Search results"
          className="siglum-search-results"
        >
          {loadError ? <p>Search is unavailable right now.</p> : null}
          {!loadError && entries === null ? <p>Loading search index…</p> : null}
          {entries && terms.length > 0 && results.length === 0 ? (
            <p>No results for “{query.trim()}”</p>
          ) : null}
          {results.map((result, index) => {
            const showSection = result.entry.sectionLabel !== previousSection;
            previousSection = result.entry.sectionLabel;
            return (
              <div key={resultHref(result)}>
                {showSection ? (
                  <div className="siglum-search-section">
                    {result.entry.sectionLabel}
                  </div>
                ) : null}
                <button
                  id={`siglum-search-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  tabIndex={-1}
                  type="button"
                  className="siglum-search-result"
                  onClick={() => go(result)}
                  onMouseMove={() => setActiveIndex(index)}
                >
                  <span className="siglum-search-result-title">
                    <Highlight text={result.entry.heading} terms={terms} />
                    {result.entry.headingId ? (
                      <small>{result.entry.pageTitle}</small>
                    ) : null}
                  </span>
                  {result.snippet ? (
                    <span className="siglum-search-snippet">
                      <Highlight text={result.snippet} terms={terms} />
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>

        <div className="siglum-search-help">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export interface SearchButtonProps {
  indexUrl: string;
  placeholder?: string;
}

export function SearchButton({
  indexUrl,
  placeholder = "Search documentation…",
}: SearchButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [modifier, setModifier] = useState("⌘");

  useEffect(() => {
    setModifier(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl");
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <>
      <button
        ref={buttonRef}
        className="siglum-search-button"
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">⌕</span>
        <span>Search</span>
        <kbd>{modifier} K</kbd>
      </button>
      {open ? (
        <SearchDialog
          indexUrl={indexUrl}
          onClose={close}
          placeholder={placeholder}
        />
      ) : null}
    </>
  );
}
