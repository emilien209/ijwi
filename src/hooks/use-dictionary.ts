"use client";

import { useLanguage } from "@/contexts/language-context";

export function useDictionary() {
  const { dict } = useLanguage();
  return { dict };
}
