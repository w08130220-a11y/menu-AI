import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Upload,
  Sparkles,
  Palette,
  Download,
  Check,
  ArrowRight,
  UtensilsCrossed,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const t = await getTranslations("landing");

  const features = [
    {
      icon: Upload,
      title: t("features.upload.title"),
      description: t("features.upload.description"),
    },
    {
      icon: Sparkles,
      title: t("features.generate.title"),
      description: t("features.generate.description"),
    },
    {
      icon: Palette,
      title: t("features.styles.title"),
      description: t("features.styles.description"),
    },
    {
      icon: Download,
      title: t("features.export.title"),
      description: t("features.export.description"),
    },
  ];

  const pricingFeatures = t.raw("pricing.features") as string[];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/20 to-transparent rounded-full blur-3xl opacity-30" />
        </div>

        <div className="container mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-in">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Menu Design</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance animate-in delay-100">
              {t("hero.title")}
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-in delay-200">
              {t("hero.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in delay-300">
              <Link href="/auth/signin">
                <Button size="lg" className="gap-2 text-base px-8">
                  {t("hero.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="text-base px-8">
                  {t("hero.ctaSecondary")}
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground animate-in delay-300">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 border-2 border-background"
                  />
                ))}
              </div>
              <span className="ml-2">Trusted by 500+ restaurants</span>
              <div className="flex items-center gap-0.5 ml-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>

          {/* Hero Preview */}
          <div className="mt-16 mx-auto max-w-5xl animate-in delay-300">
            <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5" />
              <div className="relative p-8 md:p-12">
                {/* Mock Menu Preview */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <UtensilsCrossed className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">La Bella Italia</h3>
                        <p className="text-sm text-muted-foreground">Italian Cuisine</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {["Appetizers", "Main Courses", "Desserts"].map((cat) => (
                        <div key={cat} className="rounded-xl bg-muted/50 p-4">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            {cat}
                          </h4>
                          <div className="space-y-2">
                            {[1, 2].map((i) => (
                              <div key={i} className="flex justify-between">
                                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                                <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl" />
                      <div className="relative bg-white rounded-2xl shadow-lg p-6 space-y-4 w-64">
                        <h4 className="font-serif text-lg font-bold text-center">Menu</h4>
                        <div className="space-y-3">
                          <div className="pb-2 border-b">
                            <p className="font-medium text-sm">Margherita Pizza</p>
                            <p className="text-xs text-muted-foreground">Fresh tomatoes, mozzarella...</p>
                            <p className="text-sm font-semibold text-primary mt-1">$16</p>
                          </div>
                          <div className="pb-2 border-b">
                            <p className="font-medium text-sm">Spaghetti Carbonara</p>
                            <p className="text-xs text-muted-foreground">Creamy sauce, pancetta...</p>
                            <p className="text-sm font-semibold text-primary mt-1">$18</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">{t("features.title")}</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">{t("pricing.title")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("pricing.subtitle")}</p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="relative overflow-hidden border-2 border-primary shadow-2xl">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-medium rounded-bl-xl">
                Most Popular
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">{t("pricing.price")}</span>
                    <span className="text-muted-foreground">{t("pricing.period")}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {pricingFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-accent" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/auth/signin" className="block">
                  <Button size="lg" className="w-full text-base">
                    {t("pricing.cta")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">MenuAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MenuAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
