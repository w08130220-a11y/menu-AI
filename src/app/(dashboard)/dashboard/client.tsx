"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardClient() {
  const t = useTranslations("dashboard.subscription");
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleUpgrade}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Crown className="h-4 w-4 text-yellow-500" />
      )}
      {t("upgrade")}
    </Button>
  );
}
