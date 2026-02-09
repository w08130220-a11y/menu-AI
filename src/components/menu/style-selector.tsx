"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { MenuStyle } from "@/types";

interface StyleSelectorProps {
  value: MenuStyle;
  onChange: (style: MenuStyle) => void;
}

const styles: { value: MenuStyle; preview: string }[] = [
  {
    value: "modern",
    preview: "bg-white border-gray-200 font-sans",
  },
  {
    value: "vintage",
    preview: "bg-amber-50 border-amber-200 font-serif",
  },
  {
    value: "minimal",
    preview: "bg-white border-gray-100 font-sans tracking-wide",
  },
];

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  const t = useTranslations("menu.styles");

  return (
    <div className="grid grid-cols-3 gap-4">
      {styles.map((style) => (
        <button
          key={style.value}
          type="button"
          onClick={() => onChange(style.value)}
          className={cn(
            "relative flex flex-col rounded-xl border-2 p-4 transition-all hover:shadow-md",
            value === style.value
              ? "border-primary ring-2 ring-primary/20"
              : "border-muted hover:border-muted-foreground/30"
          )}
        >
          {/* Preview box */}
          <div
            className={cn(
              "aspect-[4/3] w-full rounded-lg border mb-3",
              style.preview
            )}
          >
            <div className="p-2 space-y-1">
              <div className="h-2 w-3/4 rounded bg-current opacity-20" />
              <div className="h-1.5 w-1/2 rounded bg-current opacity-10" />
              <div className="mt-2 h-1 w-full rounded bg-current opacity-5" />
              <div className="h-1 w-4/5 rounded bg-current opacity-5" />
            </div>
          </div>
          
          <span className="font-medium text-sm">{t(style.value)}</span>
          <span className="text-xs text-muted-foreground mt-0.5">
            {t(`${style.value}Desc`)}
          </span>

          {value === style.value && (
            <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <svg
                className="h-3 w-3 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
