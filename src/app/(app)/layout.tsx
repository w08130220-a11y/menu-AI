import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const staff = await getSession();
  if (!staff) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        staff={{
          name: staff.name,
          role: staff.role,
          title: staff.title,
          storeName: staff.store.name,
        }}
      />
      <main className="flex-1 overflow-x-hidden px-6 py-6 lg:px-8">{children}</main>
    </div>
  );
}
