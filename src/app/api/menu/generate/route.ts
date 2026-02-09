import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateMenu } from "@/lib/openai";
import { z } from "zod";
import type { SupportedLanguage, MenuStyle } from "@/types";

const generateSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  type: z.string().min(1, "Restaurant type is required"),
  language: z.enum(["en", "zh", "es"]),
  style: z.enum(["modern", "vintage", "minimal"]).optional().default("modern"),
  ingredients: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = generateSchema.parse(body);

    // Check subscription status for non-subscribed users (limit to 3 free menus)
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

    // Generate dishes with AI
    const dishes = await generateMenu(
      validatedData.type,
      validatedData.language as SupportedLanguage,
      validatedData.ingredients,
      validatedData.style as MenuStyle
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
    console.error("Generate menu error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate menu" },
      { status: 500 }
    );
  }
}
