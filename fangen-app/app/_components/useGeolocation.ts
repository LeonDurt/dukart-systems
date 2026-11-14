"use client";

import { useEffect, useState } from "react";

export type Fix = { lat: number; lng: number; accuracy: number; at: number };
export type GeoError = "denied" | "unavailable" | "unsupported" | null;

/** Beobachtet den Standort, solange die Seite offen ist. */
export function useGeolocation(): { fix: Fix | null; error: GeoError } {
  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;
  const [fix, setFix] = useState<Fix | null>(null);
  const [error, setError] = useState<GeoError>(null);

  useEffect(() => {
    if (!supported) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setFix({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          at: Date.now(),
        });
      },
      (err) => setError(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [supported]);

  return { fix, error: supported ? error : "unsupported" };
}
