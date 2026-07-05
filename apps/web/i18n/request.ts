import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, getMessages, isLocale } from "@taiga/i18n";
import { LOCALE_COOKIE } from "./config";

// Configuration next-intl SANS routage d'URL : la langue vient d'un cookie,
// avec repli sur le français (langue par défaut).
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: getMessages(locale),
  };
});
