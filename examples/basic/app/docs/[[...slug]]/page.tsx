import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsPage } from "siglum/react";
import { docsContent } from "@/lib/content";
import { docs } from "@/lib/docs";

export const dynamicParams = false;

interface DocumentationPageProps {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams() {
  return docs.generateStaticParams();
}

export async function generateMetadata({
  params,
}: DocumentationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = docs.getPage(slug);

  if (!page) return {};

  return {
    title: page.title,
    description: page.description,
  };
}

export default async function DocumentationPage({
  params,
}: DocumentationPageProps) {
  const { slug } = await params;
  const page = docs.getPage(slug);

  if (!page) notFound();

  const Content = docsContent[page.slug];
  if (!Content) notFound();

  return (
    <DocsPage
      config={docs.config}
      page={page}
      sidebarFooter={<span>siglum v0.1.0</span>}
      footer={<span>Built with Siglum and ordinary Next.js routes.</span>}
    >
      <Content />
    </DocsPage>
  );
}
