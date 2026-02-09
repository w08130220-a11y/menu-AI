"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createWorker } from "tesseract.js";
import { Sparkles, Upload, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/menu/file-upload";
import { StyleSelector } from "@/components/menu/style-selector";
import { MenuPreview } from "@/components/menu/menu-preview";
import { useToast } from "@/hooks/use-toast";
import type { GeneratedDish, MenuStyle, SupportedLanguage } from "@/types";

export function MenuCreator() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("menu");
  const tForm = useTranslations("menu.form");
  const tUpload = useTranslations("menu.upload");
  const tErr = useTranslations("errors");

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [style, setStyle] = useState<MenuStyle>("modern");
  const [ingredients, setIngredients] = useState("");

  // Upload state
  const [ocrText, setOcrText] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewDishes, setPreviewDishes] = useState<GeneratedDish[]>([]);

  // OCR processing with Tesseract.js
  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessingOcr(true);
    setOcrProgress(0);

    try {
      const worker = await createWorker("eng+chi_tra+spa", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      let imageData: string | File = file;

      // For PDF files, we need to convert to image first
      // In production, you'd use pdf.js or server-side processing
      if (file.type === "application/pdf") {
        toast({
          title: "PDF Processing",
          description: "Converting PDF... This may take a moment.",
        });
        // For now, we'll just use the file directly
        // Tesseract can handle PDFs in some cases
      }

      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      setOcrText(text);
      setOcrProgress(100);

      toast({
        title: "Success!",
        description: "Text extracted from your menu.",
      });
    } catch (error) {
      console.error("OCR error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: tErr("ocrFailed"),
      });
    } finally {
      setIsProcessingOcr(false);
    }
  }, [toast, tErr]);

  // Generate menu from scratch
  const handleGenerate = async () => {
    if (!name || !type) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in restaurant name and type.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/menu/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          language,
          style,
          ingredients,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate menu");
      }

      const menu = await response.json();
      
      toast({
        title: "Menu created!",
        description: `Your ${type} menu has been generated.`,
      });

      router.push(`/menu/${menu.id}/edit`);
    } catch (error) {
      console.error("Generate error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : tErr("generationFailed"),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Refresh menu from OCR
  const handleRefresh = async () => {
    if (!name || !ocrText) {
      toast({
        variant: "destructive",
        title: "Missing data",
        description: "Please upload a menu and enter a restaurant name.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/upload-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ocrText,
          language,
          style,
          type: type || "restaurant",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process menu");
      }

      const menu = await response.json();
      
      toast({
        title: "Menu refreshed!",
        description: "Your menu has been transformed.",
      });

      router.push(`/menu/${menu.id}/edit`);
    } catch (error) {
      console.error("Refresh error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : tErr("generationFailed"),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left: Form */}
      <div>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t("create.tabs.generate")}
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              {t("create.tabs.upload")}
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{tForm("name")}</Label>
                  <Input
                    id="name"
                    placeholder={tForm("namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">{tForm("type")}</Label>
                  <Input
                    id="type"
                    placeholder={tForm("typePlaceholder")}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{tForm("language")}</Label>
                    <Select value={language} onValueChange={(v) => setLanguage(v as SupportedLanguage)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t("languages.en")}</SelectItem>
                        <SelectItem value="zh">{t("languages.zh")}</SelectItem>
                        <SelectItem value="es">{t("languages.es")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{tForm("style")}</Label>
                    <Select value={style} onValueChange={(v) => setStyle(v as MenuStyle)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">{t("styles.modern")}</SelectItem>
                        <SelectItem value="vintage">{t("styles.vintage")}</SelectItem>
                        <SelectItem value="minimal">{t("styles.minimal")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ingredients">{tForm("ingredients")}</Label>
                  <Textarea
                    id="ingredients"
                    placeholder={tForm("ingredientsPlaceholder")}
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  size="lg"
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tForm("generating")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {tForm("generate")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onOcrComplete={setOcrText}
                  isProcessing={isProcessingOcr}
                  ocrProgress={ocrProgress}
                />

                {ocrText && (
                  <div className="space-y-2">
                    <Label>Extracted Text</Label>
                    <div className="rounded-lg bg-muted p-4 text-sm max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {ocrText.slice(0, 500)}
                        {ocrText.length > 500 && "..."}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="upload-name">{tForm("name")}</Label>
                  <Input
                    id="upload-name"
                    placeholder={tForm("namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{tForm("language")}</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as SupportedLanguage)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("languages.en")}</SelectItem>
                      <SelectItem value="zh">{t("languages.zh")}</SelectItem>
                      <SelectItem value="es">{t("languages.es")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{tForm("style")}</Label>
                  <StyleSelector value={style} onChange={setStyle} />
                </div>

                <Button
                  onClick={handleRefresh}
                  disabled={isGenerating || !ocrText}
                  size="lg"
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tUpload("refreshing")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {tUpload("refresh")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right: Preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{t("preview.title")}</h2>
        </div>
        <MenuPreview
          dishes={previewDishes}
          style={style}
          restaurantName={name || "Your Restaurant"}
        />
      </div>
    </div>
  );
}
