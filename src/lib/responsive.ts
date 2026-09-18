"use client";

import { useState, useEffect } from "react";

export type Breakpoint =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl";

export const BREAKPOINTS: Record<Breakpoint, number> = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1920,
  "4xl": 2560,
  "5xl": 3440,
};

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export function useBreakpoint(): {
  breakpoint: Breakpoint;
  width: number;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  is3xl: boolean;
  is4xl: boolean;
  is5xl: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  // SSR default to 'lg'
  const [width, setWidth] = useState(1024);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: NodeJS.Timeout | null = null;

    const updateWidth = () => {
      setWidth(window.innerWidth);
    };

    updateWidth();

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateWidth, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  let current: Breakpoint = "xs";
  if (width >= 3440) current = "5xl";
  else if (width >= 2560) current = "4xl";
  else if (width >= 1920) current = "3xl";
  else if (width >= 1536) current = "2xl";
  else if (width >= 1280) current = "xl";
  else if (width >= 1024) current = "lg";
  else if (width >= 768) current = "md";
  else if (width >= 640) current = "sm";

  return {
    breakpoint: current,
    width,
    isXs: width < 640,
    isSm: width >= 640 && width < 768,
    isMd: width >= 768 && width < 1024,
    isLg: width >= 1024 && width < 1280,
    isXl: width >= 1280 && width < 1536,
    is2xl: width >= 1536 && width < 1920,
    is3xl: width >= 1920 && width < 2560,
    is4xl: width >= 2560 && width < 3440,
    is5xl: width >= 3440,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
