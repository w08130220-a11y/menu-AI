"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { UtensilsCrossed, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserNav } from "./user-nav";
import { LanguageSwitcher } from "./language-switcher";

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    subscribed?: boolean;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const t = useTranslations("nav");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-110">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            MenuAI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("dashboard")}
              </Link>
              <Link
                href="/menu/new"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("newMenu")}
              </Link>
            </>
          ) : (
            <Link
              href="/#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("pricing")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          
          {user ? (
            <UserNav user={user} />
          ) : (
            <Link href="/auth/signin">
              <Button size="sm">{t("signIn")}</Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t bg-background px-4 py-4">
          <div className="flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("dashboard")}
                </Link>
                <Link
                  href="/menu/new"
                  className="text-sm font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("newMenu")}
                </Link>
              </>
            ) : (
              <Link
                href="/#pricing"
                className="text-sm font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("pricing")}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
