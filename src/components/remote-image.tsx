"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * RemoteImage — renders an admin-provided remote image with graceful error
 * handling. If the URL fails to load, the <img> is removed so the parent's
 * background (e.g. bg-muted/40) shows as a neutral placeholder instead of a
 * broken-image icon.
 *
 * Used for article cover images. (Tool logos use ToolLogo, which has its own
 * fallback-to-initial logic.)
 */
export function RemoteImage({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [errored, setErrored] = useState(false);
  if (errored) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setErrored(true)}
      className={cn(className)}
    />
  );
}
