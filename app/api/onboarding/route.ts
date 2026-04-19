import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { BUSINESS_TYPE_PRESETS } from "@/lib/business-config";
import type { BusinessType }     from "@/lib/business-config";
import {
  serializeModules,
  getTemplateForBusinessType,
  type ModuleConfig,
} from "@/lib/modules";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  const body = await req.json();
  const {
    businessType,
    businessSubType,
    modules: rawModules,
    businessName,
    businessPhone,
    businessCity,
  } = body;

  const type    = (businessType    ?? "retail") as BusinessType;
  const subType = (businessSubType ?? null) as string | null;
  const preset  = BUSINESS_TYPE_PRESETS[type] ?? BUSINESS_TYPE_PRESETS.other;

  // Use provided modules or fall back to the template defaults
  const template = getTemplateForBusinessType(type);
  const modules: ModuleConfig = rawModules ?? template.modules;

  await prisma.business.update({
    where: { id: businessId },
    data: {
      onboardingDone:  true,
      businessType:    type,
      businessSubType: type === "retail" ? (subType ?? "OTHER") : null,
      customerLabel:   preset.customerLabel,
      productLabel:    preset.productLabel,
      saleLabel:       preset.saleLabel,
      // Keep legacy flags in sync for any direct-SQL or old-code consumers
      hasInventory:    modules.inventory,
      usesDueTracking: modules.dues,
      // New module JSON — single source of truth going forward
      modules:         serializeModules(modules),
      ...(businessName  && { businessName }),
      ...(businessPhone && { businessPhone }),
      ...(businessCity  && { businessCity }),
    },
  });

  return NextResponse.json({ success: true });
}
