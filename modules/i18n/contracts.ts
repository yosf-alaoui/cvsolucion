export type Locale = "en" | "fr" | "ar";

export type TranslationTree = Record<string, unknown>;

export type I18nModuleOptions<TContent extends TranslationTree> = {
  translations: Record<Locale, TContent>;
  fallbackLocale?: Locale;
};

export type I18nModuleContext<TContent extends TranslationTree> = {
  locale: Locale;
  content: TContent;
  t: (key: string) => unknown;
  normalizePathWithoutLocale: (path: string) => string;
  buildPathWithLocale: (path: string, locale: Locale) => string;
};
