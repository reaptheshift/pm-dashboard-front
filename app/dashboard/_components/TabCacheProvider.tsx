"use client";

import * as React from "react";

interface TabCacheData {
  documents?: any[];
  projects?: any[];
  users?: any[];
  integrations?: any;
  [key: string]: any;
}

interface TabCacheContextType {
  getCache: (key: string) => any;
  setCache: (key: string, value: any) => void;
  clearCache: (key?: string) => void;
  hasCache: (key: string) => boolean;
}

const TabCacheContext = React.createContext<TabCacheContextType | undefined>(
  undefined
);

export function TabCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = React.useState<TabCacheData>({});

  const getCache = React.useCallback(
    (key: string) => {
      return cache[key];
    },
    [cache]
  );

  const setCacheValue = React.useCallback((key: string, value: any) => {
    setCache((prev) => ({
      ...prev,
      [key]: {
        data: value,
        timestamp: Date.now(),
      },
    }));
  }, []);

  const clearCache = React.useCallback((key?: string) => {
    if (key) {
      setCache((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setCache({});
    }
  }, []);

  const hasCache = React.useCallback(
    (key: string) => {
      return cache[key] !== undefined;
    },
    [cache]
  );

  return (
    <TabCacheContext.Provider
      value={{ getCache, setCache: setCacheValue, clearCache, hasCache }}
    >
      {children}
    </TabCacheContext.Provider>
  );
}

export function useTabCache() {
  const context = React.useContext(TabCacheContext);
  if (!context) {
    throw new Error("useTabCache must be used within TabCacheProvider");
  }
  return context;
}
