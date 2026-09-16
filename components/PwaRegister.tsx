"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker took over; optional reload on next visit.
            }
          });
        });
      })
      .catch(() => {
        // Non-fatal: manifest + add-to-homescreen may still work.
      });
  }, []);

  return null;
}
