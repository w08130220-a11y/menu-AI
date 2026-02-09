import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { Geist, Geist_Mono, Playfair_Display, DM_Sans } from "next/font/google";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MenuAI - AI-Powered Menu Generator",
    template: "%s | MenuAI",
  },
  description:
    "Create stunning restaurant menus in seconds with AI. Upload your existing menu or generate from scratch.",
  keywords: ["menu generator", "restaurant menu", "AI", "menu design", "QR menu"],
  authors: [{ name: "MenuAI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://menuai.app",
    siteName: "MenuAI",
    title: "MenuAI - AI-Powered Menu Generator",
    description: "Create stunning restaurant menus in seconds with AI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MenuAI - AI-Powered Menu Generator",
    description: "Create stunning restaurant menus in seconds with AI.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f97316",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <div className="relative min-h-screen flex flex-col">
            <Navbar user={session?.user} />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
