import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "siglum/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Siglum",
    template: "%s · Siglum",
  },
  description:
    "Explicit, Next-native documentation primitives for people and agents.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      lang="en"
    >
      <body>{children}</body>
    </html>
  );
}
