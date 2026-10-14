"use client";

import { useEffect, useRef } from "react";

/**
 * Client renderer that injects arbitrary HTML (admin-trusted ad code) into
 * the DOM and executes any <script> tags it contains — required for ad
 * networks like Google AdSense, which rely on script execution.
 */
export function AdSlotRenderer({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = "";
    const template = document.createElement("template");
    template.innerHTML = code.trim();
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    // Re-create script nodes so they actually execute (innerHTML-inserted
    // scripts are not run by the browser).
    fragment.querySelectorAll("script").forEach((oldScript) => {
      const newScript = document.createElement("script");
      for (let i = 0; i < oldScript.attributes.length; i++) {
        const attr = oldScript.attributes[i];
        newScript.setAttribute(attr.name, attr.value);
      }
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
    container.appendChild(fragment);
  }, [code]);

  return <div ref={ref} className="ad-unit px-4 py-3 [&_ins]:block [&_ins]:mx-auto" />;
}
