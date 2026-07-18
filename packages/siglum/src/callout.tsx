import type { ReactNode } from "react";

export interface CalloutProps {
  children: ReactNode;
  title?: string;
  type?: "note" | "warning";
}

export function Callout({
  children,
  title,
  type = "note",
}: CalloutProps) {
  return (
    <aside className="siglum-callout" data-type={type}>
      <p className="siglum-callout-title">
        {title ?? (type === "warning" ? "Warning" : "Note")}
      </p>
      <div className="siglum-callout-content">{children}</div>
    </aside>
  );
}
