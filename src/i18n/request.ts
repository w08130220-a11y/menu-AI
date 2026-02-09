import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // Get locale from cookie, header, or default to 'en'
  let locale = cookieStore.get("locale")?.value;
  
  if (!locale) {
    const acceptLanguage = headersList.get("accept-language");
    if (acceptLanguage?.includes("zh")) {
      locale = "zh";
    } else if (acceptLanguage?.includes("es")) {
      locale = "es";
    } else {
      locale = "en";
    }
  }
  
  // Validate locale
  if (!["en", "zh", "es"].includes(locale)) {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
