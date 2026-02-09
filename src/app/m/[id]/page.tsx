import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { cn, formatPrice } from "@/lib/utils";
import type { MenuStyle } from "@/types";

interface PublicMenuPageProps {
  params: Promise<{ id: string }>;
}

const styleClasses: Record<MenuStyle, { container: string; header: string; category: string; item: string; price: string }> = {
  modern: {
    container: "bg-white font-sans min-h-screen",
    header: "bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12",
    category: "text-lg font-semibold text-gray-800 uppercase tracking-wide border-b-2 border-gray-200 pb-2 mb-6",
    item: "border-b border-gray-100 last:border-0 pb-4",
    price: "text-orange-500 font-bold text-lg",
  },
  vintage: {
    container: "bg-amber-50 font-serif min-h-screen",
    header: "bg-gradient-to-br from-amber-900 to-amber-800 text-amber-50 py-12",
    category: "text-xl font-bold text-amber-800 italic border-b-2 border-amber-300 pb-2 mb-6",
    item: "border-b border-amber-200/50 last:border-0 pb-4",
    price: "text-amber-700 font-semibold italic text-lg",
  },
  minimal: {
    container: "bg-white font-sans min-h-screen tracking-wide",
    header: "bg-black text-white py-16",
    category: "text-sm font-normal uppercase tracking-[0.3em] text-gray-400 mb-8",
    item: "border-b border-gray-100 last:border-0 pb-6",
    price: "text-gray-500 font-light text-base",
  },
};

export default async function PublicMenuPage({ params }: PublicMenuPageProps) {
  const { id } = await params;

  const menu = await prisma.menu.findUnique({
    where: { id },
    include: {
      dishes: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!menu) {
    return notFound();
  }

  const style = (menu.style as MenuStyle) || "modern";
  const classes = styleClasses[style];

  // Group dishes by category
  const categories = menu.dishes.reduce((acc, dish) => {
    const cat = dish.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {} as Record<string, typeof menu.dishes>);

  return (
    <div className={classes.container}>
      {/* Header */}
      <header className={classes.header}>
        <div className="container mx-auto px-4 text-center">
          <h1 className={cn(
            "text-4xl md:text-5xl font-bold mb-2",
            style === "minimal" && "tracking-[0.1em] font-light"
          )}>
            {menu.name}
          </h1>
          <p className={cn(
            "text-lg opacity-80 capitalize",
            style === "minimal" && "tracking-widest text-sm uppercase"
          )}>
            {menu.type}
          </p>
        </div>
      </header>

      {/* Menu Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        {Object.entries(categories).map(([category, items]) => (
          <section key={category} className="mb-12">
            <h2 className={classes.category}>{category}</h2>
            
            <div className="space-y-6">
              {items.map((dish) => (
                <div key={dish.id} className={classes.item}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-semibold text-lg",
                        style === "vintage" && "font-bold text-amber-900",
                        style === "minimal" && "font-normal tracking-wide"
                      )}>
                        {dish.name}
                      </h3>
                      {dish.description && (
                        <p className={cn(
                          "mt-1 text-gray-500",
                          style === "vintage" && "text-amber-700/80 italic",
                          style === "minimal" && "text-gray-400 font-light text-sm"
                        )}>
                          {dish.description}
                        </p>
                      )}
                    </div>
                    <span className={classes.price}>
                      {formatPrice(dish.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {menu.dishes.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p>This menu is empty.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={cn(
        "py-8 text-center text-sm border-t",
        style === "modern" && "bg-gray-50 text-gray-400",
        style === "vintage" && "bg-amber-100/50 text-amber-600",
        style === "minimal" && "text-gray-300 tracking-widest"
      )}>
        <p>Powered by MenuAI</p>
      </footer>
    </div>
  );
}
