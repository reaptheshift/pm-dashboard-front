"use client";

import * as React from "react";
import { usePathname } from "next/navigation";


export function NavigationLoader() {
  const [isLoading, setIsLoading] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    // Show loader when pathname changes
    setIsLoading(true);

    // Hide loader after a short delay to show the animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-gray-200">
        <div className="h-full bg-blue-600 animate-pulse"></div>
      </div>
    </div>
  );
}
