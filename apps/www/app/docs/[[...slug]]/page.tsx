import { DocsPage } from "@sibl/docs/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
      footer={
        <>
          <span>
            Created by <a href="https://taylor.page">Taylor Bryant</a>
          </span>
          <a href="/llms.txt">llms.txt</a>
        </>
      }
    >
      <Content />
    </DocsPage>
  );
}
