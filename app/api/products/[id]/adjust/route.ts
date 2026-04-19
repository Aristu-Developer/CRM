import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  type:     z.enum(["MANUAL_IN", "MANUAL_OUT"]),
  quantity: z.coerce.number().min(0.001),
  reason:   z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Verify product belongs to this business
    const product = await prisma.product.findFirst({ where: { id: params.id, businessId } });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const delta    = data.type === "MANUAL_IN" ? data.quantity : -data.quantity;
    const newStock = product.stock + delta;

    if (newStock < 0) return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });

    await prisma.$transaction([
      prisma.product.update({ where: { id: params.id }, data: { stock: newStock } }),
      prisma.inventoryAdjustment.create({
        data: {
          productId:  params.id,
          type:       data.type,
          quantity:   delta,
          reason:     data.reason,
          adjustedBy: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({ stock: newStock });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
