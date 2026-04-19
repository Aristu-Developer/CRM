import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeModules, type ModuleConfig } from "@/lib/modules";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const business = await prisma.business.findFirst({ where: { id: businessId, deletedAt: null } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  return NextResponse.json(business);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { businessId } = session.user;

  // Only allow known settings fields to be updated
  const {
    businessName, businessPhone, businessEmail,
    businessAddress, businessCity, currency,
    currencySymbol, invoicePrefix, lowStockDefault,
    modules: rawModules,
  } = await req.json();

  // Serialize modules object → JSON string if provided
  const modulesJson = rawModules !== undefined
    ? serializeModules(rawModules as ModuleConfig)
    : undefined;

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      ...(businessName    !== undefined && { businessName }),
      ...(businessPhone   !== undefined && { businessPhone }),
      ...(businessEmail   !== undefined && { businessEmail }),
      ...(businessAddress !== undefined && { businessAddress }),
      ...(businessCity    !== undefined && { businessCity }),
      ...(currency        !== undefined && { currency }),
      ...(currencySymbol  !== undefined && { currencySymbol }),
      ...(invoicePrefix   !== undefined && { invoicePrefix }),
      ...(lowStockDefault !== undefined && { lowStockDefault }),
      ...(modulesJson     !== undefined && {
        modules:         modulesJson,
        // Keep legacy flags in sync
        hasInventory:    (rawModules as ModuleConfig).inventory,
        usesDueTracking: (rawModules as ModuleConfig).dues,
      }),
    },
  });

  return NextResponse.json(updated);
}
