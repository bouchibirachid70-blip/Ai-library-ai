import Link from "next/link";
import { ArrowUpRight, MousePointerClick } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToolLogo } from "@/components/tool-logo";
import { cn } from "@/lib/utils";

export type ToolCardData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  pricing: string;
  logo?: string | null;
  tags?: string;
  clicksCount: number;
  category?: { name: string; slug: string; icon?: string | null } | null;
};

const PRICING_STYLES: Record<string, string> = {
  Free: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Freemium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Paid: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "Contact for pricing": "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

export function ToolCard({ tool }: { tool: ToolCardData }) {
  const tags = (tool.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <ToolLogo
          logo={tool.logo}
          name={tool.name}
          className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-accent"
          textClassName="text-xl font-semibold text-primary"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold leading-tight">{tool.name}</h3>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          {tool.category && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {tool.category.icon} {tool.category.name}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground min-h-[2.5rem]">
        {tool.description}
      </p>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
        <Badge
          variant="outline"
          className={cn("font-medium", PRICING_STYLES[tool.pricing] || "")}
        >
          {tool.pricing}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MousePointerClick className="h-3.5 w-3.5" />
          {tool.clicksCount.toLocaleString()}
        </span>
      </div>
    </Link>
  );
}
