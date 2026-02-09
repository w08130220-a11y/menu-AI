import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { refineMenuFromOCR } from "@/lib/openai";
import { z } from "zod";
import type { SupportedLanguage, MenuStyle } from "@/types";

const uploadRefreshSchema = z.object({
  ocrText: z.string().min(10, "OCR text is too short"),
  name: z.string().min(1, "Restaurant name is required"),
  language: z.enum(["en", "zh", "es"]),
  style: z.enum(["modern", "vintage", "minimal"]),
  type: z.string().optional().default("restaurant"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = uploadRefreshSchema.parse(body);

    // Check subscription status for non-subscribed users
    if (!session.user.subscribed) {
      const menuCount = await prisma.menu.count({
        where: { userId: session.user.id },
      });
      
      if (menuCount >= 3) {
        return NextResponse.json(
          { error: "Free limit reached. Please upgrade to Pro." },
          { status: 403 }
        );
      }
    }

    // Refine menu with AI
    const dishes = await refineMenuFromOCR(
      validatedData.ocrText,
      validatedData.style as MenuStyle,
      validatedData.language as SupportedLanguage
    );

    // Create menu in database
    const menu = await prisma.menu.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        type: validatedData.type,
        language: validatedData.language,
        style: validatedData.style,
        dishes: {
          create: dishes.map((dish, index) => ({
            name: dish.name,
            description: dish.description,
            price: dish.price,
            category: dish.category,
            position: index,
          })),
        },
      },
      include: {
        dishes: true,
      },
    });

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Upload refresh error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to process menu" },
      { status: 500 }
    );
  }
}
