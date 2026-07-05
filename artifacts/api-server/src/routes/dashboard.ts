import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, transactionsTable, employeesTable, inventoryTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [inventoryStats] = await db
    .select({
      totalInkModels: sql<number>`count(*)::int`,
      totalStockUnits: sql<number>`sum(${inventoryTable.stockQuantity})::int`,
      lowStockCount: sql<number>`count(*) filter (where ${inventoryTable.stockQuantity} <= ${inventoryTable.minThresholdLimit})::int`,
    })
    .from(inventoryTable);

  const [txStats] = await db
    .select({ totalTransactions: sql<number>`count(*)::int` })
    .from(transactionsTable);

  const [empStats] = await db
    .select({ totalEmployees: sql<number>`count(*)::int` })
    .from(employeesTable);

  res.json({
    totalInkModels: inventoryStats?.totalInkModels ?? 0,
    totalStockUnits: inventoryStats?.totalStockUnits ?? 0,
    lowStockCount: inventoryStats?.lowStockCount ?? 0,
    totalTransactions: txStats?.totalTransactions ?? 0,
    totalEmployees: empStats?.totalEmployees ?? 0,
  });
});

router.get("/dashboard/recent-transactions", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: transactionsTable.id,
      employeeId: transactionsTable.employeeId,
      inkId: transactionsTable.inkId,
      quantityWithdrawn: transactionsTable.quantityWithdrawn,
      transactionTimestamp: transactionsTable.transactionTimestamp,
      employeeName: employeesTable.fullName,
      employeeJobTitle: employeesTable.jobTitle,
      inkModel: inventoryTable.inkModel,
    })
    .from(transactionsTable)
    .innerJoin(employeesTable, eq(transactionsTable.employeeId, employeesTable.id))
    .innerJoin(inventoryTable, eq(transactionsTable.inkId, inventoryTable.id))
    .orderBy(desc(transactionsTable.transactionTimestamp))
    .limit(10);
  res.json(rows.map((r) => ({ ...r, transactionTimestamp: r.transactionTimestamp.toISOString() })));
});

router.get("/dashboard/consumption-by-employee", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      employeeId: employeesTable.id,
      employeeName: employeesTable.fullName,
      jobTitle: employeesTable.jobTitle,
      totalWithdrawn: sql<number>`coalesce(sum(${transactionsTable.quantityWithdrawn}), 0)::int`,
      transactionCount: sql<number>`count(${transactionsTable.id})::int`,
    })
    .from(employeesTable)
    .leftJoin(transactionsTable, eq(transactionsTable.employeeId, employeesTable.id))
    .groupBy(employeesTable.id, employeesTable.fullName, employeesTable.jobTitle)
    .orderBy(sql`sum(${transactionsTable.quantityWithdrawn}) desc nulls last`);
  res.json(rows);
});

router.get("/dashboard/consumption-by-ink", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      inkId: inventoryTable.id,
      inkModel: inventoryTable.inkModel,
      totalWithdrawn: sql<number>`coalesce(sum(${transactionsTable.quantityWithdrawn}), 0)::int`,
      transactionCount: sql<number>`count(${transactionsTable.id})::int`,
    })
    .from(inventoryTable)
    .leftJoin(transactionsTable, eq(transactionsTable.inkId, inventoryTable.id))
    .groupBy(inventoryTable.id, inventoryTable.inkModel)
    .orderBy(sql`sum(${transactionsTable.quantityWithdrawn}) desc nulls last`);
  res.json(rows);
});

export default router;
