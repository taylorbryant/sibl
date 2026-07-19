import { DocsThemeScript } from "@sibl/docs/react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@sibl/docs/styles.css";
import config from "@/sibl.config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sibl",
    template: "%s · Sibl",
  },
  description:
    "Explicit, Next-native documentation primitives for people and agents.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <DocsThemeScript storageKey={config.theme.storageKey} />
        {children}
      </body>
    </html>
  );
}
