"use client";

import { useEffect, useState, useCallback } from "react";

export function useHash(defaultHash: string = "#Documents") {
  const [hash, setHash] = useState<string>(
    typeof window === "undefined" || !window.location.hash
      ? defaultHash
      : window.location.hash
  );

  useEffect(() => {
    function handleHashChange() {
      setHash(window.location.hash || defaultHash);
    }

    window.addEventListener("hashchange", handleHashChange, false);
    // initialize on mount in case it changed before listener attached
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange, false);
    };
  }, [defaultHash]);

  const updateHash = useCallback((next: string) => {
    if (typeof window === "undefined") return;
    const normalized = next.startsWith("#") ? next : `#${next}`;
    if (window.location.hash !== normalized) {
      window.location.hash = normalized;
    }
  }, []);

  return { hash, setHash: updateHash };
}
