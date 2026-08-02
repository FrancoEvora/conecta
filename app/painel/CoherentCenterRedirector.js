"use client";

import { useEffect } from "react";

const destinations = {
  "Finance Center": "/painel/financeiro",
  "Operations Center": "/painel/sdr",
  "Connect Center": "/painel/operacao",
  "Opportunity Center": "/painel/catalogo",
  "Governance Center": "/painel/acessos"
};

export default function CoherentCenterRedirector() {
  useEffect(() => {
    function align() {
      document.querySelectorAll("a").forEach(anchor => {
        const text = anchor.textContent?.trim() || "";
        const entry = Object.entries(destinations).find(([label]) => text.includes(label));
        if (entry) anchor.setAttribute("href", entry[1]);
      });
    }
    align();
    const observer = new MutationObserver(align);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
