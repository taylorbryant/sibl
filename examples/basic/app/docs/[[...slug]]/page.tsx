import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsPageView } from "siglum/react";
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
  const page = await docs.getPage(slug);

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
  const page = await docs.getPage(slug);

  if (!page) notFound();

  return <DocsPageView config={docs.config} page={page} />;
}
