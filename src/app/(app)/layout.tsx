import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveStoreId, getStores } from "@/lib/store-context";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const staff = await getSession();
  if (!staff) redirect("/login");

  const [stores, activeStoreId] = await Promise.all([
    getStores(),
    getActiveStoreId(staff),
  ]);
  const activeStore = stores.find((s) => s.id === activeStoreId);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        staff={{
          name: staff.name,
          role: staff.role,
          title: staff.title,
          storeName:
            staff.role === "ADMIN"
              ? (activeStore?.name ?? "全部分店")
              : staff.store.name,
        }}
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        activeStoreId={activeStoreId}
      />
      <main className="flex-1 overflow-x-hidden px-6 py-6 lg:px-8">{children}</main>
    </div>
  );
}
