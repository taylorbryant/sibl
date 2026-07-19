import type { ReactNode } from "react";

export interface CalloutProps {
  children: ReactNode;
  title?: string;
  type?: "note" | "warning";
}

export function Callout({ children, title, type = "note" }: CalloutProps) {
  return (
    <aside className="sibl-callout" data-type={type}>
      <p className="sibl-callout-title">
        {title ?? (type === "warning" ? "Warning" : "Note")}
      </p>
      <div className="sibl-callout-content">{children}</div>
    </aside>
  );
}
