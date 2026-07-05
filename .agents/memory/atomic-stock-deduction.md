---
name: Atomic stock deduction
description: POST /transactions must use a raw pg client with FOR UPDATE to prevent concurrent overdraw
---

## The rule
Stock deduction + transaction insert must be atomic with a row-level lock.

**Why:** Two concurrent requests can both pass the `stockQuantity >= quantityWithdrawn` check before either deducts, leading to negative effective stock (lost update).

**How to apply:**
Use a raw `pg` client (imported from `@workspace/db` as `pool`):
1. `await client.query("BEGIN")`
2. `SELECT ... FOR UPDATE` on the inventory row — blocks concurrent writers
3. Validate stock in application code
4. `UPDATE inventory SET stock_quantity = stock_quantity - $1`
5. `INSERT INTO transactions ...`
6. `COMMIT` on success, `ROLLBACK` + respond with error on failure
7. Always `client.release()` in a `finally` block

Plain Drizzle `.update()` without a transaction is NOT safe for this pattern.
