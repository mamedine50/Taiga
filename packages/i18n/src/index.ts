import { DEFAULT_LOCALE, LOCALES, type Locale } from "@taiga/core";
import en from "./messages/en.json";
import fr from "./messages/fr.json";

export type Messages = typeof fr;

/** Catalogues de traduction partagés entre le web et le mobile. */
export const messages: Record<Locale, Messages> = { fr, en };

export { DEFAULT_LOCALE, LOCALES, type Locale };

/** Retourne un catalogue valide, avec repli sur la langue par défaut. */
export function getMessages(locale: string): Messages {
  return (messages as Record<string, Messages>)[locale] ?? messages[DEFAULT_LOCALE];
}

/** Garde-type : la chaîne est-elle une langue supportée ? */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
