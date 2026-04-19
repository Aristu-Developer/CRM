import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validations/customer";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")   ?? "";
  const status   = searchParams.get("status")   ?? "";
  const type     = searchParams.get("type")     ?? "";
  const page     = parseInt(searchParams.get("page")  ?? "1");
  const pageSize = parseInt(searchParams.get("limit") ?? "20");

  const where: any = { businessId };
  if (search) {
    where.OR = [
      { name:         { contains: search, mode: "insensitive" } },
      { phone:        { contains: search } },
      { businessName: { contains: search, mode: "insensitive" } },
      { email:        { contains: search, mode: "insensitive" } },
    ];
  }
  if (status === "active")   where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (type)                  where.customerType = type.toUpperCase();

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: { _count: { select: { sales: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  try {
    const body = await req.json();
    const data = customerSchema.parse(body);
    const customer = await prisma.customer.create({ data: { ...data, businessId } });
    return NextResponse.json(customer, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
