/**
 * Nepal CRM – Database Seed
 * Creates a demo business, users, customers, products, sales, and payments
 * Run: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Nepal CRM demo data...\n");

  // ─── Clean slate ──────────────────────────────────────────────
  await prisma.inventoryAdjustment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.teamInvite.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  // ─── Business ─────────────────────────────────────────────────
  const business = await prisma.business.create({
    data: {
      businessName:    "Sharma General Store",
      businessPhone:   "01-4412345",
      businessEmail:   "info@sharmastore.com.np",
      businessAddress: "New Baneshwor, Kathmandu",
      businessCity:    "Kathmandu",
      invoicePrefix:   "INV",
      currency:        "NPR",
      currencySymbol:  "Rs.",
      lowStockDefault: 10,
    },
  });

  // ─── Users + Memberships ─────────────────────────────────────
  const adminPassword = await bcrypt.hash("password123", 12);
  const staffPassword = await bcrypt.hash("staff123",    12);

  const admin = await prisma.user.create({
    data: {
      name:     "Admin User",
      email:    "admin@demo.com",
      password: adminPassword,
    },
  });

  const staff = await prisma.user.create({
    data: {
      name:     "Ram Karki",
      email:    "ram@demo.com",
      password: staffPassword,
    },
  });

  await prisma.membership.create({
    data: { userId: admin.id, businessId: business.id, role: "ADMIN" },
  });

  await prisma.membership.create({
    data: { userId: staff.id, businessId: business.id, role: "STAFF" },
  });

  console.log("✅ Users created");
  console.log("   Admin: admin@demo.com / password123");
  console.log("   Staff: ram@demo.com   / staff123\n");

  // ─── Products ─────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({ data: { businessId: business.id, name: "Basmati Rice (5kg)",       sku: "RICE-001",  category: "Grocery", costPrice: 450, sellingPrice: 550, stock: 120, reorderLevel: 20, unit: "bag"    } }),
    prisma.product.create({ data: { businessId: business.id, name: "Mustard Oil (1L)",          sku: "OIL-001",   category: "Grocery", costPrice: 200, sellingPrice: 250, stock: 80,  reorderLevel: 15, unit: "litre"  } }),
    prisma.product.create({ data: { businessId: business.id, name: "Dal (Black Lentil 1kg)",    sku: "DAL-001",   category: "Grocery", costPrice: 130, sellingPrice: 160, stock: 60,  reorderLevel: 10, unit: "kg"     } }),
    prisma.product.create({ data: { businessId: business.id, name: "Salt (1kg)",                sku: "SALT-001",  category: "Grocery", costPrice: 20,  sellingPrice: 30,  stock: 200, reorderLevel: 30, unit: "kg"     } }),
    prisma.product.create({ data: { businessId: business.id, name: "Sugar (1kg)",               sku: "SUGAR-001", category: "Grocery", costPrice: 65,  sellingPrice: 80,  stock: 150, reorderLevel: 25, unit: "kg"     } }),
    prisma.product.create({ data: { businessId: business.id, name: "Soap (Lifebuoy)",           sku: "SOAP-001",  category: "FMCG",    costPrice: 35,  sellingPrice: 50,  stock: 5,   reorderLevel: 15, unit: "pcs"    } }), // Low stock
    prisma.product.create({ data: { businessId: business.id, name: "Toothpaste (Colgate 100g)", sku: "TP-001",    category: "FMCG",    costPrice: 75,  sellingPrice: 100, stock: 40,  reorderLevel: 12, unit: "pcs"    } }),
    prisma.product.create({ data: { businessId: business.id, name: "Washing Powder (500g)",     sku: "WASH-001",  category: "FMCG",    costPrice: 85,  sellingPrice: 120, stock: 35,  reorderLevel: 10, unit: "packet" } }),
    prisma.product.create({ data: { businessId: business.id, name: "Biscuit (Glucose 200g)",    sku: "BISC-001",  category: "Snacks",  costPrice: 25,  sellingPrice: 35,  stock: 3,   reorderLevel: 20, unit: "packet" } }), // Low stock
    prisma.product.create({ data: { businessId: business.id, name: "Noodles (Wai Wai 75g)",     sku: "NOOD-001",  category: "Snacks",  costPrice: 20,  sellingPrice: 28,  stock: 200, reorderLevel: 50, unit: "packet" } }),
  ]);

  // Seed inventory adjustments for initial stock
  await Promise.all(products.map((p) =>
    prisma.inventoryAdjustment.create({
      data: { productId: p.id, type: "INITIAL", quantity: p.stock, reason: "Initial stock entry", adjustedBy: admin.id },
    })
  ));

  console.log("✅ 10 products created\n");

  // ─── Customers ───────────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.create({ data: { businessId: business.id, name: "Hari Prasad Shrestha", phone: "9841234567", email: "hari@gmail.com",          address: "Balaju, Kathmandu",          city: "Kathmandu", customerType: "INDIVIDUAL" } }),
    prisma.customer.create({ data: { businessId: business.id, name: "Sunita Tamang",        phone: "9812345678",                                    address: "Bhaktapur",                  city: "Bhaktapur", customerType: "INDIVIDUAL" } }),
    prisma.customer.create({ data: { businessId: business.id, name: "Krishna Enterprises",  phone: "9801234567", email: "krishna@enterprise.com.np", address: "Putalisadak, Kathmandu",     city: "Kathmandu", businessName: "Krishna Enterprises Pvt. Ltd.", customerType: "BUSINESS", panVat: "302145678" } }),
    prisma.customer.create({ data: { businessId: business.id, name: "Sita Gurung",          phone: "9823456789",                                    address: "Pokhara-6, Lakeside",        city: "Pokhara",   customerType: "INDIVIDUAL", notes: "Regular customer, always pays on time" } }),
    prisma.customer.create({ data: { businessId: business.id, name: "Binod Thapa",          phone: "9856789012",                                    address: "Butwal-5",                   city: "Butwal",    customerType: "INDIVIDUAL" } }),
    prisma.customer.create({ data: { businessId: business.id, name: "Mahesh Trading Co.",   phone: "056-123456", email: "mahesh@trading.com.np",     address: "Bharatpur-10, Chitwan",      city: "Bharatpur", businessName: "Mahesh Trading Co.", customerType: "BUSINESS", panVat: "401234567" } }),
    prisma.customer.create({ data: { businessId: business.id, name: "Kamala Devi Rai",      phone: "9861234567",                                    address: "Dharan-9, Sunsari",          city: "Dharan",    customerType: "INDIVIDUAL" } }),
    prisma.customer.create({ data: { businessId: business.id, name: "Pradip Shahi",         phone: "9867890123",                                    address: "Nepalgunj-4",                city: "Nepalgunj", customerType: "INDIVIDUAL" } }),
  ]);

  console.log("✅ 8 customers created\n");

  // ─── Sales + Payments ────────────────────────────────────────
  async function createSale(opts: {
    customer:       typeof customers[0];
    days:           number;
    items:          { product: typeof products[0]; qty: number }[];
    paidRatio:      number;
    promiseNote?:   string;
    nextRepayDays?: number;
  }) {
    const saleDate    = subDays(new Date(), opts.days);
    const subtotal    = opts.items.reduce((s, { product, qty }) => s + product.sellingPrice * qty, 0);
    const totalAmount = subtotal;
    const paidAmount  = Math.round(totalAmount * opts.paidRatio);
    const dueAmount   = totalAmount - paidAmount;

    let paymentStatus: "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE" = "UNPAID";
    if (paidAmount >= totalAmount)                                    paymentStatus = "PAID";
    else if (paidAmount > 0)                                          paymentStatus = "PARTIAL";
    else if (opts.nextRepayDays && opts.nextRepayDays < 0)            paymentStatus = "OVERDUE";

    const count         = await prisma.sale.count({ where: { businessId: business.id } });
    const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;

    const sale = await prisma.sale.create({
      data: {
        businessId:    business.id,
        invoiceNumber,
        customerId:    opts.customer.id,
        saleDate,
        subtotal,
        discountAmount: 0,
        totalAmount,
        paidAmount,
        dueAmount,
        paymentStatus,
        paymentMethod: "CASH",
        promiseNote:   opts.promiseNote,
        nextRepayDate: opts.nextRepayDays ? subDays(new Date(), -opts.nextRepayDays) : undefined,
        createdById:   admin.id,
        items: {
          create: opts.items.map(({ product, qty }) => ({
            productId:   product.id,
            productName: product.name,
            quantity:    qty,
            unitPrice:   product.sellingPrice,
            discount:    0,
            total:       product.sellingPrice * qty,
          })),
        },
      },
    });

    for (const { product, qty } of opts.items) {
      await prisma.product.update({
        where: { id: product.id },
        data:  { stock: { decrement: qty } },
      });
      await prisma.inventoryAdjustment.create({
        data: { productId: product.id, type: "SALE", quantity: -qty, reason: `Sale ${invoiceNumber}`, adjustedBy: admin.id },
      });
    }

    if (paidAmount > 0) {
      await prisma.payment.create({
        data: {
          businessId:    business.id,
          saleId:        sale.id,
          customerId:    opts.customer.id,
          paymentDate:   saleDate,
          amount:        paidAmount,
          paymentMethod: "CASH",
          referenceNote: `Payment for ${invoiceNumber}`,
          receivedById:  admin.id,
        },
      });
    }

    return sale;
  }

  // 15 sales across different scenarios
  await createSale({ customer: customers[0], days: 30, items: [{ product: products[0], qty: 2  }, { product: products[1], qty: 3  }], paidRatio: 1 });
  await createSale({ customer: customers[1], days: 25, items: [{ product: products[2], qty: 5  }, { product: products[3], qty: 10 }], paidRatio: 1 });
  await createSale({ customer: customers[2], days: 20, items: [{ product: products[4], qty: 20 }, { product: products[6], qty: 10 }], paidRatio: 0.5, promiseNote: "Will pay remaining after 15th",                   nextRepayDays: 5  });
  await createSale({ customer: customers[3], days: 18, items: [{ product: products[0], qty: 4  }],                                  paidRatio: 1 });
  await createSale({ customer: customers[4], days: 15, items: [{ product: products[7], qty: 6  }, { product: products[8], qty: 10 }], paidRatio: 0,   promiseNote: "Cheque promised, given collateral: mobile phone", nextRepayDays: -5 });
  await createSale({ customer: customers[5], days: 14, items: [{ product: products[0], qty: 10 }, { product: products[1], qty: 5  }], paidRatio: 1 });
  await createSale({ customer: customers[0], days: 12, items: [{ product: products[9], qty: 24 }, { product: products[3], qty: 5  }], paidRatio: 1 });
  await createSale({ customer: customers[6], days: 10, items: [{ product: products[5], qty: 12 }],                                  paidRatio: 0.3, promiseNote: "Pay rest next week",                              nextRepayDays: 3  });
  await createSale({ customer: customers[7], days: 8,  items: [{ product: products[2], qty: 3  }, { product: products[4], qty: 4  }], paidRatio: 0 });
  await createSale({ customer: customers[1], days: 6,  items: [{ product: products[6], qty: 5  }, { product: products[7], qty: 3  }], paidRatio: 1 });
  await createSale({ customer: customers[2], days: 5,  items: [{ product: products[0], qty: 8  }],                                  paidRatio: 1 });
  await createSale({ customer: customers[3], days: 4,  items: [{ product: products[9], qty: 50 }],                                  paidRatio: 0.6, promiseNote: "Transfer the rest via eSewa" });
  await createSale({ customer: customers[4], days: 3,  items: [{ product: products[1], qty: 2  }, { product: products[5], qty: 4  }], paidRatio: 1 });
  await createSale({ customer: customers[0], days: 2,  items: [{ product: products[3], qty: 15 }, { product: products[4], qty: 6  }], paidRatio: 0.5 });
  await createSale({ customer: customers[5], days: 1,  items: [{ product: products[0], qty: 5  }, { product: products[6], qty: 8  }], paidRatio: 1 });

  const saleCount    = await prisma.sale.count();
  const paymentCount = await prisma.payment.count();
  console.log(`✅ ${saleCount} sales created with payments`);
  console.log(`✅ ${paymentCount} payments recorded\n`);

  console.log("─────────────────────────────────────");
  console.log("🎉 Seed complete! Start the app with:");
  console.log("   npm run dev");
  console.log("");
  console.log("🔑 Login credentials:");
  console.log("   Admin: admin@demo.com / password123");
  console.log("   Staff: ram@demo.com   / staff123");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
