"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Download,
  QrCode,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import type { Menu } from "@/types";
import { cn } from "@/lib/utils";

interface MenuCardProps {
  menu: Menu;
  onDelete: (id: string) => void;
}

const styleColors: Record<string, string> = {
  modern: "from-blue-500 to-purple-500",
  vintage: "from-amber-500 to-orange-500",
  minimal: "from-gray-400 to-gray-600",
};

export function MenuCard({ menu, onDelete }: MenuCardProps) {
  const t = useTranslations("dashboard.menuCard");
  const [showQR, setShowQR] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this menu?")) return;
    
    setIsDeleting(true);
    try {
      await fetch(`/api/menu/${menu.id}`, { method: "DELETE" });
      onDelete(menu.id);
    } catch (error) {
      console.error("Failed to delete menu:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL}/m/${menu.id}`;

  return (
    <>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        {/* Header gradient */}
        <div
          className={cn(
            "h-24 bg-gradient-to-br relative",
            styleColors[menu.style || "modern"]
          )}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="text-white">
              <h3 className="font-bold text-lg truncate">{menu.name}</h3>
              <p className="text-white/80 text-sm capitalize">{menu.type}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("dishes", { count: menu.dishes?.length || 0 })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("lastUpdated", {
                  date: formatDistanceToNow(new Date(menu.updatedAt), {
                    addSuffix: true,
                  }),
                })}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/menu/${menu.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("view")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/menu/${menu.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("edit")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowQR(true)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  {t("qrCode")}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/api/menu/${menu.id}/pdf`}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("download")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Quick actions */}
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/menu/${menu.id}`}>
                <Eye className="mr-2 h-3 w-3" />
                {t("view")}
              </Link>
            </Button>
            <Button asChild size="sm" className="flex-1">
              <Link href={`/menu/${menu.id}/edit`}>
                <Pencil className="mr-2 h-3 w-3" />
                {t("edit")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {menu.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <QRCodeSVG value={menuUrl} size={200} />
            </div>
            <p className="text-sm text-muted-foreground text-center break-all">
              {menuUrl}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(menuUrl);
              }}
            >
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
