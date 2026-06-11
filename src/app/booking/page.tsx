import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BookingClient } from "./booking-client";

export const metadata = { title: "線上預約" };
export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const [stores, services, staffList] = await Promise.all([
    prisma.store.findMany({ orderBy: { name: "asc" } }),
    prisma.service.findMany({
      where: { active: true },
      select: { id: true, name: true, category: true, price: true, durationMin: true, description: true, depositAmount: true },
      orderBy: [{ category: "asc" }, { price: "asc" }],
    }),
    prisma.staff.findMany({
      where: { active: true },
      select: { id: true, name: true, title: true, color: true, storeId: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-ink ink-texture">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-brand text-xl font-bold text-white">
              Beauty<span className="text-gold">Time</span>
            </span>
          </div>
          <span className="text-sm text-white/55">{stores[0]?.phone}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-brand text-center text-3xl font-bold mb-1">線上預約</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">
          免註冊，四步驟完成預約
        </p>
        <BookingClient
          stores={stores.map((s) => ({ id: s.id, name: s.name, address: s.address }))}
          services={services}
          staffList={staffList}
        />
      </main>
    </div>
  );
}
