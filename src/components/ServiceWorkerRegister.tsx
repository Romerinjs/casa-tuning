"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registrado con alcance:", registration.scope);
          })
          .catch((error) => {
            console.error("Error al registrar Service Worker:", error);
          });
      });
    }
  }, []);

  return null;
}
