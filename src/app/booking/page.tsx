import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BookingClient } from "./booking-client";

export const metadata = { title: "線上預約" };
export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const [store, services, staffList] = await Promise.all([
    prisma.store.findFirst(),
    prisma.service.findMany({
      where: { active: true },
      select: { id: true, name: true, category: true, price: true, durationMin: true, description: true },
      orderBy: [{ category: "asc" }, { price: "asc" }],
    }),
    prisma.staff.findMany({
      where: { active: true },
      select: { id: true, name: true, title: true, color: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-background">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-6 w-6" />
            <span className="text-xl font-bold">{store?.name ?? "BeauHub"}</span>
          </div>
          <span className="text-sm text-muted-foreground">{store?.phone}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-center text-2xl font-bold mb-1">線上預約</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">
          免註冊，四步驟完成預約
        </p>
        <BookingClient
          services={services}
          staffList={staffList}
          storeName={store?.name ?? "BeauHub"}
        />
      </main>
    </div>
  );
}
