import type { Locale } from "@taiga/i18n";

const intlLocale = (locale: Locale): string => (locale === "en" ? "en-CA" : "fr-CA");

export function formatMoney(
  amount: number | null | undefined,
  locale: Locale,
  currency = "CAD",
): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat(intlLocale(locale), { style: "currency", currency }).format(amount);
}

export function formatNumber(
  n: number | null | undefined,
  locale: Locale,
  digits = 2,
): string {
  if (n == null) return "—";
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(iso));
}
