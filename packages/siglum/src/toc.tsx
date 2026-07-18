"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface TocHeading {
  id: string;
  level: 2 | 3;
  text: string;
}

export function DocsTableOfContents({ minimumHeadings = 2 }) {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".siglum-article h2[id], .siglum-article h3[id]",
      ),
    );
    if (elements.length < minimumHeadings) {
      setHeadings([]);
      setActiveId(null);
      return;
    }

    setHeadings(
      elements.map((element) => ({
        id: element.id,
        level: element.tagName === "H2" ? 2 : 3,
        text: element.textContent ?? "",
      })),
    );

    const computeActive = () => {
      let current = elements[0]?.id ?? null;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = elements.at(-1)?.id ?? current;
      else {
        for (const element of elements) {
          if (element.getBoundingClientRect().top <= 120) current = element.id;
          else break;
        }
      }
      setActiveId(current);
    };

    computeActive();
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        computeActive();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [minimumHeadings, pathname]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="siglum-toc-nav">
      <p>On this page</p>
      <ol>
        {headings.map((heading) => (
          <li data-depth={heading.level} key={heading.id}>
            <a
              aria-current={heading.id === activeId ? "location" : undefined}
              href={`#${heading.id}`}
              onClick={() => setActiveId(heading.id)}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
