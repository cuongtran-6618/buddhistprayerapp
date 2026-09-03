import { I18n } from "i18n-js";
import { useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import en from '@/app/locales/en.json';
import vi from '@/app/locales/vi.json';

export const i18n = new I18n({ en, vi });
i18n.defaultLocale = "vi";
i18n.locale = "vi";

export type I18nHandle = { t: (key: string, vars?: object) => string; locale: string };

/**
 * Use inside components/hooks.
 * Returns a NEW object on each language change so React Compiler re-evaluates
 * all i18n.t() calls — necessary because i18n is a mutable singleton and the
 * compiler cannot detect locale mutations via reference equality.
 */
export function useI18n(): I18nHandle {
  const language = useAppStore((state) => state.language);
  i18n.locale = language;
  // ponytail: new wrapper object per language change forces React Compiler cache miss
  return useMemo(() => ({
    t: (key: string, vars?: object) => i18n.t(key, vars as any),
    locale: language,
  }), [language]);
}
