import type { DocsConfig, DocsLink } from "./config.js";

const providerNames = {
  github: "GitHub",
  npm: "npm",
  pypi: "PyPI",
} as const;

function GitHubIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.2.8-.5v-2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.8 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.4 1.2a11.8 11.8 0 0 1 6.2 0c2.4-1.6 3.4-1.2 3.4-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.5-2.8 5.5-5.5 5.8.4.4.8 1.1.8 2.2v3.2c0 .3.2.6.8.5A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

function NpmIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
    </svg>
  );
}

function brandedLinkLabel(projectTitle: string, link: DocsLink): string {
  if (link.type === "external") return link.label;
  return link.label ?? `${projectTitle} on ${providerNames[link.type]}`;
}

function ProjectLink({
  link,
  projectTitle,
}: {
  link: DocsLink;
  projectTitle: string;
}) {
  const isExternalUrl = link.href.startsWith("http");

  if (link.type === "external") {
    return (
      <a
        className="sibl-project-link"
        data-type={link.type}
        href={link.href}
        rel={isExternalUrl ? "noreferrer" : undefined}
        target={isExternalUrl ? "_blank" : undefined}
      >
        {link.label}
      </a>
    );
  }

  const label = brandedLinkLabel(projectTitle, link);
  return (
    <a
      aria-label={label}
      className="sibl-project-link"
      data-type={link.type}
      href={link.href}
      rel={isExternalUrl ? "noreferrer" : undefined}
      target={isExternalUrl ? "_blank" : undefined}
      title={label}
    >
      {link.type === "github" ? <GitHubIcon /> : null}
      {link.type === "npm" ? <NpmIcon /> : null}
      {link.type === "pypi" ? <span aria-hidden="true">Py</span> : null}
    </a>
  );
}

function displayVersion(version: string): string {
  return version.startsWith("v") ? version : `v${version}`;
}

export function DocsProjectMeta({ config }: { config: DocsConfig }) {
  if (config.links.length === 0 && !config.version) return null;

  return (
    <div className="sibl-project-meta">
      {config.links.map((link) => (
        <ProjectLink
          key={`${link.type}-${link.href}`}
          link={link}
          projectTitle={config.title}
        />
      ))}
      {config.version ? (
        <span className="sibl-project-version">
          {displayVersion(config.version)}
        </span>
      ) : null}
    </div>
  );
}
