import Link from "next/link";
import { Sparkles } from "lucide-react";

const FOOTER_LINKS = {
  Browse: [
    { href: "/tools", label: "All Tools" },
    { href: "/categories", label: "Categories" },
    { href: "/top-tools", label: "Top Tools" },
    { href: "/blog", label: "Blog" },
  ],
  Contribute: [
    { href: "/submit", label: "Submit a Tool" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/30">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="tracking-tight">Aivora</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A curated directory of the best AI tools, organized by category.
              Discover, compare, and build faster.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-3 text-sm font-semibold">{title}</h3>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Aivora. All rights reserved.</p>
          <p>Built for people building with AI.</p>
        </div>
      </div>
    </footer>
  );
}
