import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, pool, transactionsTable, employeesTable, inventoryTable } from "@workspace/db";
import {
  CreateTransactionBody,
  GetTransactionParams,
  GetVoucherDataParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getTransactionDetail(id: number) {
  const [row] = await db
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
    .where(eq(transactionsTable.id, id));
  return row;
}

router.get("/transactions", async (_req, res): Promise<void> => {
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
    .orderBy(desc(transactionsTable.transactionTimestamp));
  res.json(rows.map((r) => ({ ...r, transactionTimestamp: r.transactionTimestamp.toISOString() })));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { employeeId, inkId, quantityWithdrawn } = parsed.data;

  // Run stock deduction + transaction insert atomically
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify employee exists
    const empResult = await client.query(
      "SELECT id FROM employees WHERE id = $1",
      [employeeId]
    );
    if (empResult.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "Employee not found" });
      return;
    }

    // Lock the inventory row to prevent concurrent overdraw
    const inkResult = await client.query(
      "SELECT id, stock_quantity FROM inventory WHERE id = $1 FOR UPDATE",
      [inkId]
    );
    if (inkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "Ink item not found" });
      return;
    }

    const currentStock: number = inkResult.rows[0].stock_quantity;
    if (currentStock < quantityWithdrawn) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: `Insufficient stock. Available: ${currentStock}` });
      return;
    }

    // Deduct stock (check >= 0 enforced at DB level)
    await client.query(
      "UPDATE inventory SET stock_quantity = stock_quantity - $1 WHERE id = $2",
      [quantityWithdrawn, inkId]
    );

    // Insert transaction record
    const txResult = await client.query(
      "INSERT INTO transactions (employee_id, ink_id, quantity_withdrawn) VALUES ($1, $2, $3) RETURNING id",
      [employeeId, inkId, quantityWithdrawn]
    );
    const transactionId: number = txResult.rows[0].id;

    await client.query("COMMIT");

    const detail = await getTransactionDetail(transactionId);
    res.status(201).json({ ...detail, transactionTimestamp: detail!.transactionTimestamp.toISOString() });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const detail = await getTransactionDetail(params.data.id);
  if (!detail) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json({ ...detail, transactionTimestamp: detail.transactionTimestamp.toISOString() });
});

router.get("/transactions/:id/voucher", async (req, res): Promise<void> => {
  const params = GetVoucherDataParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const detail = await getTransactionDetail(params.data.id);
  if (!detail) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json({
    transactionId: detail.id,
    employeeName: detail.employeeName,
    employeeJobTitle: detail.employeeJobTitle,
    inkModel: detail.inkModel,
    quantityWithdrawn: detail.quantityWithdrawn,
    transactionTimestamp: detail.transactionTimestamp.toISOString(),
  });
});

export default router;
