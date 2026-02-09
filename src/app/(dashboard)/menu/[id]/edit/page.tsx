import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MenuEditor } from "./menu-editor";

interface EditMenuPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMenuPage({ params }: EditMenuPageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("menu.edit");

  if (!session?.user?.id) {
    return notFound();
  }

  const menu = await prisma.menu.findUnique({
    where: { id },
    include: {
      dishes: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!menu || menu.userId !== session.user.id) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{menu.name}</p>
      </div>
      <MenuEditor menu={menu} />
    </div>
  );
}
