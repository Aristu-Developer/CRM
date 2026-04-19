import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validations/payment";

function calcPaymentStatus(total: number, paid: number, dueDate?: Date | null): "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE" {
  if (paid >= total) return "PAID";
  if (paid > 0)      return "PARTIAL";
  if (dueDate && new Date(dueDate) < new Date()) return "OVERDUE";
  return "UNPAID";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;
  const { searchParams } = new URL(req.url);
  const search     = searchParams.get("search")     ?? "";
  const from       = searchParams.get("from")       ?? "";
  const to         = searchParams.get("to")         ?? "";
  const customerId = searchParams.get("customerId") ?? "";
  const page       = parseInt(searchParams.get("page")  ?? "1");
  const pageSize   = parseInt(searchParams.get("limit") ?? "20");

  const where: any = { businessId };
  if (search) {
    where.OR = [
      { sale: { invoiceNumber: { contains: search, mode: "insensitive" } } },
      { sale: { customer: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }
  if (customerId) where.customerId = customerId;
  if (from || to) {
    where.paymentDate = {};
    if (from) where.paymentDate.gte = new Date(from);
    if (to)   where.paymentDate.lte = new Date(to + "T23:59:59");
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        sale:       { select: { invoiceNumber: true, totalAmount: true, customer: { select: { name: true } } } },
        receivedBy: { select: { name: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return NextResponse.json({ payments, total, page });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = session.user;

  try {
    const body = await req.json();
    const data = paymentSchema.parse(body);

    const sale = await prisma.sale.findFirst({ where: { id: data.saleId, businessId } });
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

    if (data.amount > sale.dueAmount + 0.01) {
      return NextResponse.json(
        { error: `Payment exceeds outstanding due of Rs.${sale.dueAmount.toFixed(2)}` },
        { status: 400 }
      );
    }

    const newPaid   = sale.paidAmount + data.amount;
    const newDue    = Math.max(0, sale.totalAmount - newPaid);
    const newStatus = calcPaymentStatus(sale.totalAmount, newPaid, sale.nextRepayDate);

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          businessId,
          saleId:        data.saleId,
          customerId:    sale.customerId,
          paymentDate:   new Date(data.paymentDate),
          amount:        data.amount,
          paymentMethod: data.paymentMethod,
          referenceNote: data.referenceNote,
          remarks:       data.remarks,
          receivedById:  session.user.id,
        },
      }),
      prisma.sale.update({
        where: { id: data.saleId },
        data:  { paidAmount: newPaid, dueAmount: newDue, paymentStatus: newStatus },
      }),
    ]);

    return NextResponse.json(payment, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
