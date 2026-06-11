import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isManager } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { fmtMoney, SERVICE_CATEGORIES } from "@/lib/constants";
import { ServiceDialog, ToggleActiveButton } from "./service-dialog";

export default async function ServicesPage() {
  const me = await getSession();
  if (!me) redirect("/login");
  if (!isManager(me)) redirect("/dashboard");

  const services = await prisma.service.findMany({
    orderBy: [{ category: "asc" }, { price: "asc" }],
  });

  const grouped = Object.keys(SERVICE_CATEGORIES)
    .map((cat) => ({ cat, items: services.filter((s) => s.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">服務項目</h1>
          <p className="text-muted-foreground text-sm">
            價目表會同步顯示在線上預約與 POS
          </p>
        </div>
        <ServiceDialog />
      </div>

      {grouped.map(({ cat, items }) => (
        <Card key={cat}>
          <CardContent className="pt-5">
            <h2 className="font-bold mb-3">{SERVICE_CATEGORIES[cat]}</h2>
            <div className="divide-y">
              {items.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                    )}
                  </div>
                  <span className="text-muted-foreground shrink-0">{s.durationMin} 分</span>
                  <span className="font-mono font-medium w-24 text-right shrink-0">{fmtMoney(s.price)}</span>
                  <ToggleActiveButton id={s.id} active={s.active} endpoint="services" />
                  <ServiceDialog service={s} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
