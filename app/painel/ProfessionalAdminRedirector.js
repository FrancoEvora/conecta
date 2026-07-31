"use client";
import { useEffect } from "react";

const routes = {
  "Equipe e acessos": "/painel/acessos",
  "Empreendimentos": "/painel/catalogo"
};

export default function ProfessionalAdminRedirector() {
  useEffect(() => {
    function route(event) {
      const button = event.target.closest("button");
      if (!button) return;
      const destination = routes[button.textContent.trim()];
      if (!destination) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.nativeEvent?.stopImmediatePropagation) event.nativeEvent.stopImmediatePropagation();
      window.location.assign(destination);
    }
    document.addEventListener("click", route, true);
    return () => document.removeEventListener("click", route, true);
  }, []);
  return null;
}
