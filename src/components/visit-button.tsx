"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  url: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
};

/**
 * VisitButton — anchor that opens the tool's website in a new tab and
 * fires-and-forgets a POST to /api/tools/[slug]/click to record the visit.
 */
export function VisitButton({
  slug,
  url,
  className,
  size = "lg",
  variant = "default",
}: Props) {
  const handleClick = () => {
    try {
      // Fire-and-forget; keepalive ensures the request survives navigation.
      void fetch(`/api/tools/${encodeURIComponent(slug)}/click`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {
        /* swallow */
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <Button asChild size={size} variant={variant} className={cn(className)}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        Visit website
        <ExternalLink className="ml-2 h-4 w-4" />
      </a>
    </Button>
  );
}
