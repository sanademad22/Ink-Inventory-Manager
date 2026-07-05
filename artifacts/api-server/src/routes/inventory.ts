import { Router, type IRouter } from "express";
import { eq, lte } from "drizzle-orm";
import { db, inventoryTable } from "@workspace/db";
import {
  CreateInkItemBody,
  UpdateInkItemBody,
  GetInkItemParams,
  UpdateInkItemParams,
  DeleteInkItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapItem(item: typeof inventoryTable.$inferSelect) {
  return {
    ...item,
    isLowStock: item.stockQuantity <= item.minThresholdLimit,
    createdAt: item.createdAt.toISOString(),
  };
}

router.get("/inventory", async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryTable).orderBy(inventoryTable.inkModel);
  res.json(items.map(mapItem));
});

router.post("/inventory", async (req, res): Promise<void> => {
  const parsed = CreateInkItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.insert(inventoryTable).values(parsed.data).returning();
  res.status(201).json(mapItem(item));
});

router.get("/inventory/low-stock", async (_req, res): Promise<void> => {
  const items = await db
    .select()
    .from(inventoryTable)
    .where(lte(inventoryTable.stockQuantity, inventoryTable.minThresholdLimit))
    .orderBy(inventoryTable.stockQuantity);
  res.json(items.map(mapItem));
});

router.get("/inventory/:id", async (req, res): Promise<void> => {
  const params = GetInkItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db.select().from(inventoryTable).where(eq(inventoryTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Ink item not found" });
    return;
  }
  res.json(mapItem(item));
});

router.patch("/inventory/:id", async (req, res): Promise<void> => {
  const params = UpdateInkItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInkItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db
    .update(inventoryTable)
    .set(parsed.data)
    .where(eq(inventoryTable.id, params.data.id))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Ink item not found" });
    return;
  }
  res.json(mapItem(item));
});

router.delete("/inventory/:id", async (req, res): Promise<void> => {
  const params = DeleteInkItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db.delete(inventoryTable).where(eq(inventoryTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Ink item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
