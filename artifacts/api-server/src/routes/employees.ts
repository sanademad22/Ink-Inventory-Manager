import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, employeesTable, transactionsTable, inventoryTable } from "@workspace/db";
import {
  CreateEmployeeBody,
  UpdateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  DeleteEmployeeParams,
  GetEmployeeTransactionsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/employees", async (req, res): Promise<void> => {
  const employees = await db.select().from(employeesTable).orderBy(employeesTable.fullName);
  res.json(employees.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })));
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [employee] = await db.insert(employeesTable).values(parsed.data).returning();
  res.status(201).json({ ...employee, createdAt: employee.createdAt.toISOString() });
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const params = GetEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, params.data.id));
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json({ ...employee, createdAt: employee.createdAt.toISOString() });
});

router.patch("/employees/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [employee] = await db
    .update(employeesTable)
    .set(parsed.data)
    .where(eq(employeesTable.id, params.data.id))
    .returning();
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json({ ...employee, createdAt: employee.createdAt.toISOString() });
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  const params = DeleteEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [employee] = await db.delete(employeesTable).where(eq(employeesTable.id, params.data.id)).returning();
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/employees/:id/transactions", async (req, res): Promise<void> => {
  const params = GetEmployeeTransactionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, params.data.id));
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
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
    .where(eq(transactionsTable.employeeId, params.data.id))
    .orderBy(transactionsTable.transactionTimestamp);
  res.json(rows.map((r) => ({ ...r, transactionTimestamp: r.transactionTimestamp.toISOString() })));
});

export default router;
