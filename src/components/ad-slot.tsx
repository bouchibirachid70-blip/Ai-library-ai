import { getActiveAdSlots } from "@/lib/constants";
import { AdSlotRenderer } from "@/components/ad-slot-renderer";

/**
 * AdSlot — renders active ad units for a given position on the public site.
 *
 * Server component: fetches active ad slots from the DB and renders their
 * code via a client renderer that executes <script> tags (required for ad
 * networks like AdSense). Renders nothing when there are no active slots,
 * so no layout shift occurs.
 */
export async function AdSlot({
  position,
  showLabel = true,
}: {
  position: string;
  showLabel?: boolean;
}) {
  const slots = await getActiveAdSlots(position);
  if (!slots || slots.length === 0) return null;

  return (
    <div className="my-6">
      {showLabel && (
        <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">
          Advertisement
        </div>
      )}
      <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
        {slots.map((s) => (
          <AdSlotRenderer key={s.id} code={s.code} />
        ))}
      </div>
    </div>
  );
}
