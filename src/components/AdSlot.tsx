// Renders whatever active ad slot(s) an admin has assigned to `position`
// (managed at /admin/ad-slots). Renders nothing when no slot matches, so it
// never leaves an empty box on the page.
//
// The `code` field is admin-authored content written through the
// authenticated admin API (requireAdmin on the server) — the same trust
// level as any other admin write in this project — so, unlike user-submitted
// text (see src/lib/sanitize.ts), it is deliberately NOT escaped: ad
// networks like AdSense ship <script> tags that must execute as-is.

import { useEffect, useRef, useState } from 'react';
import { fetchActiveAdSlots } from '../lib/adSlots';
import type { AdSlot as AdSlotType } from '../types';

function injectAdHtml(container: HTMLDivElement, html: string) {
  container.innerHTML = html;
  // Scripts inserted via innerHTML never execute — recreate each <script>
  // tag so the browser actually runs it (standard DOM workaround).
  const scripts = Array.from(container.querySelectorAll('script'));
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });
    newScript.text = oldScript.textContent || '';
    oldScript.replaceWith(newScript);
  });
}

function AdUnit({ slot }: { slot: AdSlotType }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) injectAdHtml(ref.current, slot.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot.id, slot.code]);

  return <div ref={ref} data-ad-slot={slot.position} />;
}

export default function AdSlot({
  position,
  className = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
}: {
  position: string;
  className?: string;
}) {
  const [slots, setSlots] = useState<AdSlotType[]>([]);

  useEffect(() => {
    let active = true;
    fetchActiveAdSlots().then((all) => {
      if (!active) return;
      setSlots(all.filter((s) => s.position === position));
    });
    return () => {
      active = false;
    };
  }, [position]);

  if (slots.length === 0) return null;

  return (
    <div className={className} data-ad-position={position}>
      {slots.map((slot) => (
        <AdUnit key={slot.id} slot={slot} />
      ))}
    </div>
  );
}
