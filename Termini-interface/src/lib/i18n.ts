import { MessageDescriptor, i18n } from "@lingui/core";
import { LANGUAGE_LOCALSTORAGE_KEY } from "config/localStorage";
import { isDevelopment } from "config/env";
import mapValues from "lodash/mapValues";
import { useLingui } from "@lingui/react";
import { useMemo } from "react";

// uses BCP-47 codes from https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/language_plural_rules.html
export const locales = {
  en: "English", // 英语
  es: "Español", // 西班牙语
  zh: "中文",    // 中文
  ko: "한국어",  // 韩语
  ru: "Русский", // 俄语
  ja: "日本語",  // 日语
  fr: "Français", // 法语
  de: "Deutsch",  // 德语
  // ...(isDevelopment() && { pseudo: "Test" }),
};

export const defaultLocale = "en";

export function isTestLanguage(locale: string) {
  return locale === "pseudo";
}

export async function dynamicActivate(locale: string) {
  const { messages } = await import(`../locales/${locale}/messages.po`);

  if (!isTestLanguage(locale)) {
    localStorage.setItem(LANGUAGE_LOCALSTORAGE_KEY, locale);
  }
  i18n.load(locale, messages);
  i18n.activate(locale);
}

export function useLocalizedMap<T extends Record<string, MessageDescriptor>>(map: T): Record<keyof T, string> {
  const { _ } = useLingui();

  return useMemo(() => mapValues(map, (value) => _(value)), [_, map]);
}
