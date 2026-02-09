import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// GET /api/menu/[id] - Get a specific menu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        dishes: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Check if user owns the menu (unless it's a public view)
    if (session?.user?.id && menu.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Get menu error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}

// PUT /api/menu/[id] - Update a menu
const updateMenuSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  language: z.enum(["en", "zh", "es"]).optional(),
  style: z.enum(["modern", "vintage", "minimal"]).optional(),
  dishes: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        category: z.string().min(1),
        imageUrl: z.string().optional(),
        position: z.number().int().min(0),
      })
    )
    .optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    if (menu.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateMenuSchema.parse(body);

    // Update menu and dishes
    const updatedMenu = await prisma.$transaction(async (tx) => {
      // Update menu details
      const menuUpdate = await tx.menu.update({
        where: { id },
        data: {
          name: validatedData.name,
          type: validatedData.type,
          language: validatedData.language,
          style: validatedData.style,
        },
      });

      // Update dishes if provided
      if (validatedData.dishes) {
        // Delete existing dishes
        await tx.dish.deleteMany({ where: { menuId: id } });

        // Create new dishes
        await tx.dish.createMany({
          data: validatedData.dishes.map((dish) => ({
            menuId: id,
            name: dish.name,
            description: dish.description || null,
            price: dish.price,
            category: dish.category,
            imageUrl: dish.imageUrl || null,
            position: dish.position,
          })),
        });
      }

      return tx.menu.findUnique({
        where: { id },
        include: {
          dishes: {
            orderBy: { position: "asc" },
          },
        },
      });
    });

    return NextResponse.json(updatedMenu);
  } catch (error) {
    console.error("Update menu error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update menu" },
      { status: 500 }
    );
  }
}

// DELETE /api/menu/[id] - Delete a menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    if (menu.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.menu.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete menu error:", error);
    return NextResponse.json(
      { error: "Failed to delete menu" },
      { status: 500 }
    );
  }
}
