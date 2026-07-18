import type { ComponentType } from "react";
import AgentOutputs from "@/content/docs/agent-outputs.mdx";
import Architecture from "@/content/docs/architecture.mdx";
import Configuration from "@/content/docs/configuration.mdx";
import Overview from "@/content/docs/index.mdx";
import Installation from "@/content/docs/installation.mdx";

export const docsContent: Record<string, ComponentType> = {
  "": Overview,
  "agent-outputs": AgentOutputs,
  architecture: Architecture,
  configuration: Configuration,
  installation: Installation,
};
