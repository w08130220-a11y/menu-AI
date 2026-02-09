import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MenuCard } from "@/components/menu/menu-card";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");

  if (!session?.user?.id) {
    return null;
  }

  const [menus, user] = await Promise.all([
    prisma.menu.findMany({
      where: { userId: session.user.id },
      include: {
        dishes: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeSubscriptionId: true,
        stripeCurrentPeriodEnd: true,
      },
    }),
  ]);

  const isSubscribed = !!(
    user?.stripeSubscriptionId &&
    user?.stripeCurrentPeriodEnd &&
    user.stripeCurrentPeriodEnd > new Date()
  );

  const freeMenusLeft = isSubscribed ? Infinity : Math.max(0, 3 - menus.length);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {isSubscribed
              ? t("subscription.pro")
              : t("subscription.menusLeft", { count: freeMenusLeft })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isSubscribed && (
            <DashboardClient />
          )}
          <Link href="/menu/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("empty.cta")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Menu Grid */}
      {menus.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("empty.title")}</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t("empty.description")}
            </p>
            <Link href="/menu/new">
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                {t("empty.cta")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <DashboardMenuGrid menus={menus} />
      )}
    </div>
  );
}

function DashboardMenuGrid({ menus }: { menus: any[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {menus.map((menu) => (
        <MenuCard
          key={menu.id}
          menu={menu}
          onDelete={() => {}}
        />
      ))}
    </div>
  );
}
