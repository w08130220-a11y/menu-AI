"use client";

import { useTranslations } from "next-intl";
import { cn, formatPrice } from "@/lib/utils";
import type { GeneratedDish, MenuStyle } from "@/types";

interface MenuPreviewProps {
  dishes: GeneratedDish[];
  style: MenuStyle;
  restaurantName?: string;
}

const styleClasses: Record<MenuStyle, { container: string; title: string; item: string; price: string }> = {
  modern: {
    container: "bg-white font-sans",
    title: "text-2xl font-bold tracking-tight text-gray-900",
    item: "border-b border-gray-100 last:border-0",
    price: "text-primary font-semibold",
  },
  vintage: {
    container: "bg-amber-50 font-serif",
    title: "text-2xl font-bold text-amber-900 border-b-2 border-amber-300 pb-2",
    item: "border-b border-amber-200/50 last:border-0",
    price: "text-amber-800 font-medium italic",
  },
  minimal: {
    container: "bg-white font-sans tracking-wide",
    title: "text-xl font-light uppercase tracking-[0.2em] text-gray-800",
    item: "border-b border-gray-50 last:border-0",
    price: "text-gray-600 font-normal",
  },
};

export function MenuPreview({ dishes, style, restaurantName }: MenuPreviewProps) {
  const t = useTranslations("menu.preview");
  const classes = styleClasses[style];

  // Group dishes by category
  const categories = dishes.reduce((acc, dish) => {
    const cat = dish.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {} as Record<string, GeneratedDish[]>);

  if (dishes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-12 text-center">
        <div className="text-4xl mb-4">📋</div>
        <p className="text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border shadow-lg overflow-hidden", classes.container)}>
      {/* Header */}
      {restaurantName && (
        <div className="px-8 py-6 text-center border-b">
          <h2 className={classes.title}>{restaurantName}</h2>
        </div>
      )}

      {/* Menu Content */}
      <div className="p-6 space-y-8">
        {Object.entries(categories).map(([category, items]) => (
          <div key={category}>
            <h3 className={cn(
              "mb-4",
              style === "modern" && "text-lg font-semibold text-gray-800 uppercase tracking-wide",
              style === "vintage" && "text-lg font-bold text-amber-800 italic",
              style === "minimal" && "text-sm font-normal uppercase tracking-[0.3em] text-gray-500 mb-6"
            )}>
              {category}
            </h3>
            
            <div className="space-y-4">
              {items.map((dish, index) => (
                <div
                  key={index}
                  className={cn("py-3", classes.item)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className={cn(
                        "font-medium",
                        style === "modern" && "text-gray-900",
                        style === "vintage" && "text-amber-900 font-semibold",
                        style === "minimal" && "text-gray-800 font-normal tracking-wide"
                      )}>
                        {dish.name}
                      </h4>
                      {dish.description && (
                        <p className={cn(
                          "mt-1 text-sm",
                          style === "modern" && "text-gray-500",
                          style === "vintage" && "text-amber-700/80 italic",
                          style === "minimal" && "text-gray-400 font-light"
                        )}>
                          {dish.description}
                        </p>
                      )}
                    </div>
                    <span className={cn("shrink-0", classes.price)}>
                      {formatPrice(dish.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={cn(
        "px-8 py-4 text-center text-xs border-t",
        style === "modern" && "bg-gray-50 text-gray-400",
        style === "vintage" && "bg-amber-100/50 text-amber-600",
        style === "minimal" && "text-gray-300 tracking-widest"
      )}>
        Made with MenuAI
      </div>
    </div>
  );
}
