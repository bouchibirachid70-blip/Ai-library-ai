"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Detects whether a string looks like an image URL.
 * Accepts absolute http(s) URLs and relative paths ending in a common
 * image extension (e.g. "/logo.png", "icon.webp").
 */
function isImageUrl(value: string): boolean {
  if (!value) return false;
  const v = value.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return true;
  if (/^\S+\.(png|jpe?g|gif|webp|svg|avif|ico|bmp)$/i.test(v)) return true;
  return false;
}

export type ToolLogoProps = {
  /** The raw `logo` DB field: an image URL, an emoji/short icon, or empty. */
  logo?: string | null;
  /** Tool name, used for the fallback initial + alt text. */
  name: string;
  /** Box classes: sizing, rounded corners, gradient background, place-items-center. */
  className: string;
  /** Text classes applied to the emoji or fallback initial (size/weight/color). */
  textClassName?: string;
  /** Override classes for the <img> element. Defaults to filling the box. */
  imgClassName?: string;
};

/**
 * ToolLogo — renders a tool's logo across three cases:
 *   1. image URL  → <img> with object-contain + onError fallback to initial
 *   2. emoji/icon → displayed as text
 *   3. empty/invalid → clean initial derived from the tool name
 *
 * Used by ToolCard, Tool Detail and Top Tools so logo rendering is consistent
 * everywhere and raw URLs are never shown as visible text.
 *
 * The callback ref checks `complete && naturalWidth === 0` at mount to catch
 * images that failed BEFORE React hydration attached the onError handler (a
 * common SSR + external-URL issue), so a broken remote logo cleanly falls back
 * to the tool's initial.
 */
export function ToolLogo({
  logo,
  name,
  className,
  textClassName,
  imgClassName,
}: ToolLogoProps) {
  const [errored, setErrored] = useState(false);
  const value = (logo ?? "").trim();
  const isUrl = isImageUrl(value);
  const isImg = isUrl && !errored;
  // Treat as emoji/text only when it is NOT a URL (a URL that fails to load
  // must fall back to the name initial, never render the raw URL as text).
  const isEmoji = !isUrl && value.length > 0;
  const initial = (name.trim().charAt(0) || "?").toUpperCase();

  // Callback ref runs at mount (and on src change) to detect images that
  // already failed before hydration; onError covers later failures.
  const imgRef = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) {
      setErrored(true);
    }
  }, []);

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden",
        className,
      )}
    >
      {isImg ? (
        <img
          ref={imgRef}
          src={value}
          alt={`${name} logo`}
          loading="lazy"
          onError={() => setErrored(true)}
          className={cn("h-full w-full object-contain p-1.5", imgClassName)}
        />
      ) : isEmoji ? (
        <span className={cn("leading-none", textClassName)}>{value}</span>
      ) : (
        <span className={cn("leading-none", textClassName)}>{initial}</span>
      )}
    </div>
  );
}

