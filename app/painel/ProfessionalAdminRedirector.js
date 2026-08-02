"use client";

import { useEffect } from "react";

const routes = {
  "Equipe e acessos": "/painel/acessos",
  "Produtos": "/painel/catalogo",
  "Leads e CRM": "/painel/sdr"
};

function replaceButtonLabel(button, nextLabel) {
  const label = Array.from(button.querySelectorAll("span")).find(element =>
    element.textContent?.trim() === "Empreendimentos"
  );
  if (label) label.textContent = nextLabel;
  else {
    const textNode = Array.from(button.childNodes).find(node =>
      node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === "Empreendimentos"
    );
    if (textNode) textNode.textContent = ` ${nextLabel}`;
  }
  button.dataset.professionalDestination = routes[nextLabel];
  button.setAttribute("aria-label", nextLabel);
}

export default function ProfessionalAdminRedirector() {
  useEffect(() => {
    function relabel() {
      document.querySelectorAll("button").forEach(button => {
        const text = button.textContent?.trim();
        if (text === "Empreendimentos") replaceButtonLabel(button, "Produtos");
        if (text === "Leads e CRM") button.dataset.professionalDestination = routes["Leads e CRM"];
      });
    }

    function route(event) {
      const button = event.target.closest("button");
      if (!button) return;
      const destination = button.dataset.professionalDestination || routes[button.textContent.trim()];
      if (!destination) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.nativeEvent?.stopImmediatePropagation) event.nativeEvent.stopImmediatePropagation();
      window.location.assign(destination);
    }

    relabel();
    const observer = new MutationObserver(relabel);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", route, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", route, true);
    };
  }, []);

  return null;
}
