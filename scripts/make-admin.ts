/**
 * Promote a user to ADMIN by email (within their first membership).
 * Usage: npm run make-admin -- your@email.com
 *
 * If no users exist at all, pass --create to create a new admin account:
 *   npm run make-admin -- your@email.com --create --name "Your Name" --password "secret"
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args    = process.argv.slice(2);
  const email   = args.find((a) => !a.startsWith("--"));
  const create  = args.includes("--create");
  const nameArg = args.find((_, i) => args[i - 1] === "--name");
  const passArg = args.find((_, i) => args[i - 1] === "--password");

  if (!email) {
    console.error("Usage: npm run make-admin -- <email> [--create --name <name> --password <pass>]");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (existing) {
    // Promote in all memberships they belong to
    const result = await prisma.membership.updateMany({
      where: { userId: existing.id },
      data:  { role: "ADMIN" },
    });
    if (result.count === 0) {
      console.error(`❌ User found but has no business membership: ${email}`);
      process.exit(1);
    }
    console.log(`✅ Promoted ${existing.name} (${existing.email}) to ADMIN in ${result.count} workspace(s)`);
    console.log("   Sign out and sign back in for the new role to take effect.");
    return;
  }

  if (!create) {
    console.error(`❌ No user found with email: ${email}`);
    console.error("   If you want to create a new admin account, add --create --name <name> --password <pass>");
    process.exit(1);
  }

  const name     = nameArg ?? "Admin";
  const password = passArg ?? "admin123";
  const hashed   = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: { businessName: `${name}'s Business` },
    });
    const created = await tx.user.create({
      data: { name, email: email.toLowerCase(), password: hashed },
    });
    await tx.membership.create({
      data: { userId: created.id, businessId: business.id, role: "ADMIN" },
    });
    return created;
  });

  console.log(`✅ Created ADMIN account: ${user.name} (${user.email})`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
