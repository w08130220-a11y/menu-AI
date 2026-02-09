import OpenAI from "openai";
import { GeneratedDish, MenuStyle, SupportedLanguage } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageNames: Record<SupportedLanguage, string> = {
  en: "English",
  zh: "Chinese (Traditional)",
  es: "Spanish",
};

const styleDescriptions: Record<MenuStyle, string> = {
  modern: "clean, contemporary, and minimalist with elegant descriptions",
  vintage: "classic, nostalgic, and warm with rich, evocative descriptions",
  minimal: "ultra-simple, understated, and refined with concise descriptions",
};

export async function generateMenu(
  restaurantType: string,
  language: SupportedLanguage,
  ingredients?: string,
  style: MenuStyle = "modern"
): Promise<GeneratedDish[]> {
  const langName = languageNames[language];
  const styleDesc = styleDescriptions[style];

  const prompt = `Generate a ${restaurantType} restaurant menu in ${langName}. 
Style: ${styleDesc}.
${ingredients ? `Focus on these ingredients: ${ingredients}` : ""}

Create 12-15 dishes across categories (Appetizers, Main Courses, Desserts, Beverages).

For each dish provide:
- name: Creative, appetizing name (in ${langName})
- description: Enticing description, 15-25 words (in ${langName})
- price: Realistic price in USD ($8-$45)
- category: One of "Appetizers", "Main Courses", "Desserts", "Beverages"

Output ONLY valid JSON array: [{"name":"...", "description":"...", "price": number, "category":"..."}]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a professional menu designer. Output ONLY valid JSON, no markdown or explanation.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content || "[]";
  
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanedContent) as GeneratedDish[];
  } catch (error) {
    console.error("Failed to parse OpenAI response:", content);
    throw new Error("Failed to generate menu. Please try again.");
  }
}

export async function refineMenuFromOCR(
  ocrText: string,
  style: MenuStyle,
  language: SupportedLanguage
): Promise<GeneratedDish[]> {
  const langName = languageNames[language];
  const styleDesc = styleDescriptions[style];

  const prompt = `Parse and refine this extracted menu text into a professional menu.

Original text:
"""
${ocrText}
"""

Style: ${styleDesc}
Language: ${langName}

Instructions:
1. Extract all dish names, descriptions, and prices from the text
2. Improve descriptions to be more appetizing (15-25 words each)
3. Standardize prices to USD (if unclear, estimate $10-$45 based on dish type)
4. Categorize into: "Appetizers", "Main Courses", "Desserts", "Beverages"
5. Translate everything to ${langName} if not already
6. Fix any OCR errors in names

Output ONLY valid JSON array: [{"name":"...", "description":"...", "price": number, "category":"..."}]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a professional menu designer and translator. Output ONLY valid JSON, no markdown or explanation.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2500,
  });

  const content = response.choices[0]?.message?.content || "[]";
  
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanedContent) as GeneratedDish[];
  } catch (error) {
    console.error("Failed to parse OpenAI response:", content);
    throw new Error("Failed to refine menu. Please try again.");
  }
}
