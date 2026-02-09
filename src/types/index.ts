import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      subscribed?: boolean;
    };
  }
}

export interface Dish {
  id: string;
  menuId: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Menu {
  id: string;
  userId: string;
  name: string;
  type: string;
  language: string;
  style: string | null;
  originalFile: string | null;
  qrUrl: string | null;
  dishes: Dish[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedDish {
  name: string;
  description: string;
  price: number;
  category: string;
}

export type MenuStyle = "modern" | "vintage" | "minimal";
export type SupportedLanguage = "en" | "zh" | "es";

export interface MenuFormData {
  name: string;
  type: string;
  language: SupportedLanguage;
  style?: MenuStyle;
  ingredients?: string;
}

export interface UploadFormData {
  style: MenuStyle;
  language: SupportedLanguage;
  file: File;
}

export interface OCRResult {
  text: string;
  confidence: number;
}
