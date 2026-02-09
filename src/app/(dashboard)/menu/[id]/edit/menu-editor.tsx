"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  Download,
  QrCode,
  Code,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuPreview } from "@/components/menu/menu-preview";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import type { Menu, Dish, MenuStyle, SupportedLanguage, GeneratedDish } from "@/types";

interface MenuEditorProps {
  menu: Menu & { dishes: Dish[] };
}

const categories = ["Appetizers", "Main Courses", "Desserts", "Beverages", "Other"];

export function MenuEditor({ menu }: MenuEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("menu.edit");
  const tExport = useTranslations("menu.export");

  const [dishes, setDishes] = useState<GeneratedDish[]>(
    menu.dishes.map((d) => ({
      name: d.name,
      description: d.description || "",
      price: d.price,
      category: d.category,
    }))
  );
  const [style, setStyle] = useState<MenuStyle>((menu.style as MenuStyle) || "modern");
  const [isSaving, setIsSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/m/${menu.id}`;

  const addDish = () => {
    setDishes([
      ...dishes,
      { name: "", description: "", price: 0, category: "Main Courses" },
    ]);
  };

  const updateDish = (index: number, field: keyof GeneratedDish, value: string | number) => {
    const updated = [...dishes];
    updated[index] = { ...updated[index], [field]: value };
    setDishes(updated);
  };

  const removeDish = (index: number) => {
    setDishes(dishes.filter((_, i) => i !== index));
  };

  const moveDish = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === dishes.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...dishes];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setDishes(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/menu/${menu.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          dishes: dishes.map((dish, index) => ({
            name: dish.name,
            description: dish.description,
            price: dish.price,
            category: dish.category,
            position: index,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save menu");
      }

      toast({
        title: "Saved!",
        description: "Your menu has been updated.",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save menu. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyEmbedCode = () => {
    const embedCode = `<iframe src="${menuUrl}" width="100%" height="800" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({
      title: tExport("embedCopied"),
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left: Editor */}
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>

          <Button variant="outline" onClick={() => setShowQR(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            {tExport("qrCode")}
          </Button>

          <Button variant="outline" asChild>
            <a href={`/api/menu/${menu.id}/pdf`} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              {tExport("pdf")}
            </a>
          </Button>

          <Button variant="outline" onClick={copyEmbedCode}>
            <Code className="mr-2 h-4 w-4" />
            {tExport("embed")}
          </Button>
        </div>

        {/* Style selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Style</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={style} onValueChange={(v) => setStyle(v as MenuStyle)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="vintage">Vintage</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Dishes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Dishes ({dishes.length})</CardTitle>
            <Button onClick={addDish} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("addDish")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {dishes.map((dish, index) => (
              <div
                key={index}
                className="relative rounded-lg border p-4 space-y-3"
              >
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveDish(index, "up")}
                    disabled={index === 0}
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeDish(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <Label>{t("dishName")}</Label>
                    <Input
                      value={dish.name}
                      onChange={(e) => updateDish(index, "name", e.target.value)}
                      placeholder="Dish name"
                    />
                  </div>
                  <div>
                    <Label>{t("price")}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={dish.price}
                      onChange={(e) =>
                        updateDish(index, "price", parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label>{t("category")}</Label>
                  <Select
                    value={dish.category}
                    onValueChange={(v) => updateDish(index, "category", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t("description")}</Label>
                  <Textarea
                    value={dish.description}
                    onChange={(e) => updateDish(index, "description", e.target.value)}
                    placeholder="Describe the dish..."
                    rows={2}
                  />
                </div>
              </div>
            ))}

            {dishes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No dishes yet. Click "Add Dish" to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: Preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Tabs defaultValue="preview">
          <TabsList className="mb-4">
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <MenuPreview
              dishes={dishes}
              style={style}
              restaurantName={menu.name}
            />
          </TabsContent>
        </Tabs>
      </div>

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
              onClick={() => navigator.clipboard.writeText(menuUrl)}
            >
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
