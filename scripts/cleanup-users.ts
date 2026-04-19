/**
 * scripts/cleanup-users.ts
 *
 * Safely removes all registered CRM users EXCEPT the platform admin.
 *
 * Run with:
 *   npm run cleanup-users
 *
 * ── What this does ────────────────────────────────────────────────────────────
 *
 *  1. Reassigns Sale.createdById         → admin (preserves all sale records)
 *  2. Reassigns Payment.receivedById     → admin (preserves all payment records)
 *  3. Reassigns Purchase.createdById     → admin (preserves all purchase records)
 *  4. Reassigns Expense.createdById      → admin (preserves all expense records)
 *  5. Reassigns Loan.createdById         → admin (preserves all loan records)
 *  6. Reassigns LoanRepayment.createdById→ admin (preserves all repayment records)
 *  7. Reassigns InventoryAdjustment.adjustedBy → admin (preserves audit history)
 *  8. Nullifies TeamInvite.acceptedById  where accepted by a deleted user
 *  9. Deletes   TeamInvite rows          where invitedById = deleted user (non-nullable)
 * 10. Deletes   Membership rows          for deleted users
 * 11. Deletes   Session rows             for deleted users (JWT strategy — likely empty)
 * 12. Deletes   User rows
 *
 * ── What is NOT touched ───────────────────────────────────────────────────────
 *
 *  - Businesses / workspaces — left fully intact with all their data
 *  - Customers, Products, Suppliers, SaleItems, PurchaseItems — untouched
 *  - The surviving admin's memberships, sessions, and data — untouched
 *
 * ── Re-sign-in requirement ────────────────────────────────────────────────────
 *
 *  NOT required. The admin's JWT is issued at login and contains only the user's
 *  id/email/name. Deleting other users does not invalidate the admin's existing JWT.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KEEP_EMAIL = "sangharshajoshi.workmail@gmail.com";

async function main() {
  // ── 1. Resolve the surviving admin ────────────────────────────────────────
  const admin = await prisma.user.findUnique({ where: { email: KEEP_EMAIL } });

  if (!admin) {
    console.error(`✖ Admin account not found: ${KEEP_EMAIL}`);
    console.error("  Cannot proceed — surviving admin must exist first.");
    process.exit(1);
  }

  console.log(`✔ Surviving admin: ${admin.name} (${admin.email})`);
  console.log(`  id: ${admin.id}`);

  // ── 2. Identify users to delete ───────────────────────────────────────────
  const toDelete = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, name: true, email: true },
  });

  if (toDelete.length === 0) {
    console.log("\nNo other users found. Nothing to do.");
    return;
  }

  const deleteIds = toDelete.map((u) => u.id);

  console.log(`\nUsers to be deleted (${toDelete.length}):`);
  toDelete.forEach((u) => console.log(`  - ${u.name} <${u.email}>`));
  console.log("");

  // ── 3. Reassign Sale.createdById ──────────────────────────────────────────
  const { count: sales } = await prisma.sale.updateMany({
    where: { createdById: { in: deleteIds } },
    data:  { createdById: admin.id },
  });
  console.log(`  Sales reassigned:             ${sales}`);

  // ── 4. Reassign Payment.receivedById ──────────────────────────────────────
  const { count: payments } = await prisma.payment.updateMany({
    where: { receivedById: { in: deleteIds } },
    data:  { receivedById: admin.id },
  });
  console.log(`  Payments reassigned:          ${payments}`);

  // ── 5. Reassign Purchase.createdById ──────────────────────────────────────
  const { count: purchases } = await prisma.purchase.updateMany({
    where: { createdById: { in: deleteIds } },
    data:  { createdById: admin.id },
  });
  console.log(`  Purchases reassigned:         ${purchases}`);

  // ── 6. Reassign Expense.createdById ───────────────────────────────────────
  const { count: expenses } = await prisma.expense.updateMany({
    where: { createdById: { in: deleteIds } },
    data:  { createdById: admin.id },
  });
  console.log(`  Expenses reassigned:          ${expenses}`);

  // ── 7. Reassign Loan.createdById ──────────────────────────────────────────
  const { count: loans } = await prisma.loan.updateMany({
    where: { createdById: { in: deleteIds } },
    data:  { createdById: admin.id },
  });
  console.log(`  Loans reassigned:             ${loans}`);

  // ── 8. Reassign LoanRepayment.createdById ─────────────────────────────────
  const { count: repayments } = await prisma.loanRepayment.updateMany({
    where: { createdById: { in: deleteIds } },
    data:  { createdById: admin.id },
  });
  console.log(`  Loan repayments reassigned:   ${repayments}`);

  // ── 9. Reassign InventoryAdjustment.adjustedBy ────────────────────────────
  const { count: adjustments } = await prisma.inventoryAdjustment.updateMany({
    where: { adjustedBy: { in: deleteIds } },
    data:  { adjustedBy: admin.id },
  });
  console.log(`  Inventory adjustments fixed:  ${adjustments}`);

  // ── 10. Nullify TeamInvite.acceptedById (nullable FK) ─────────────────────
  const { count: invNullified } = await prisma.teamInvite.updateMany({
    where: { acceptedById: { in: deleteIds } },
    data:  { acceptedById: null },
  });
  console.log(`  Invite acceptedById nulled:   ${invNullified}`);

  // ── 11. Delete TeamInvites where invitedById = deleted user ───────────────
  //    (non-nullable FK — cannot be nullified, must be deleted)
  const { count: invDeleted } = await prisma.teamInvite.deleteMany({
    where: { invitedById: { in: deleteIds } },
  });
  console.log(`  Team invites deleted:         ${invDeleted}`);

  // ── 12. Delete Memberships of deleted users ────────────────────────────────
  const { count: memberships } = await prisma.membership.deleteMany({
    where: { userId: { in: deleteIds } },
  });
  console.log(`  Memberships deleted:          ${memberships}`);

  // ── 13. Delete Sessions of deleted users ──────────────────────────────────
  const { count: sessions } = await prisma.session.deleteMany({
    where: { userId: { in: deleteIds } },
  });
  console.log(`  Sessions deleted:             ${sessions}`);

  // ── 14. Delete User records ────────────────────────────────────────────────
  const { count: users } = await prisma.user.deleteMany({
    where: { id: { in: deleteIds } },
  });
  console.log(`  Users deleted:                ${users}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("");
  console.log("──────────────────────────────────────────");
  console.log("✔ Cleanup complete.");
  console.log(`  Surviving admin : ${admin.name} (${admin.email})`);
  console.log("  Business data   : fully preserved (records reassigned to admin)");
  console.log("  Re-sign-in      : NOT required");
}

main()
  .catch((e) => {
    console.error("\n✖ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
