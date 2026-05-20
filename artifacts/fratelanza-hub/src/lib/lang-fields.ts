// Strict language form helpers.
// When language is AR, ONLY the AR field is shown and required.
// When language is EN, ONLY the EN field is shown and required.
// The "other" field is sent as null to the server (server accepts null on bilingual fields).

import { useLanguage } from "@/components/LanguageProvider";

export type LangPair = { en: string | null; ar: string | null };

/**
 * Returns the value to display for a bilingual field, falling back to whichever
 * side is populated when the active-language side is empty.
 */
export function displayBilingual(pair: LangPair | undefined | null, lang: "en" | "ar"): string {
  if (!pair) return "";
  const primary = lang === "ar" ? pair.ar : pair.en;
  const fallback = lang === "ar" ? pair.en : pair.ar;
  return primary || fallback || "";
}

/**
 * Hook returning helpers for binding a single visible form field to the correct
 * underlying EN or AR column based on the current language.
 *
 * Usage:
 *   const lf = useLangField();
 *   <Input
 *     dir={lf.dir}
 *     value={lf.value({ en: form.name, ar: form.nameAr })}
 *     onChange={e => setForm(lf.set(form, "name", "nameAr", e.target.value))}
 *   />
 */
export function useLangField() {
  const { language, isRtl } = useLanguage();
  const isAr = language === "ar";
  return {
    lang: language,
    isAr,
    dir: isAr ? ("rtl" as const) : ("ltr" as const),
    /** Read the value for the active language from an EN/AR pair. */
    value: (pair: LangPair): string => (isAr ? pair.ar ?? "" : pair.en ?? ""),
    /**
     * Update a form-state record by writing to the active-language column only,
     * leaving the other column null. Use this in onChange handlers.
     */
    set<T extends Record<string, any>>(form: T, enKey: keyof T, arKey: keyof T, value: string): T {
      if (isAr) return { ...form, [arKey]: value };
      return { ...form, [enKey]: value };
    },
    /**
     * Build the payload for a bilingual field: active language gets the value,
     * inactive side gets null. Pass to server.
     */
    payload(value: string): { en: string | null; ar: string | null } {
      if (isAr) return { en: null, ar: value };
      return { en: value, ar: null };
    },
    /** Display a bilingual stored pair, falling back to the populated side. */
    display: (pair: LangPair | undefined | null): string => displayBilingual(pair, language),
    isRtl,
  };
}
