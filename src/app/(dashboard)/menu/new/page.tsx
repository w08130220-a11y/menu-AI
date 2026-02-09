import { getTranslations } from "next-intl/server";
import { MenuCreator } from "./menu-creator";

export default async function NewMenuPage() {
  const t = await getTranslations("menu.create");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>
      <MenuCreator />
    </div>
  );
}
