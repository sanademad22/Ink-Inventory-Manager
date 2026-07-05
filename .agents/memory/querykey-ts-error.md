---
name: queryKey TS error pattern
description: TypeScript requires explicit queryKey when passing query options to generated hooks
---

## The rule
When passing a `query` options object to any Orval-generated `use*` hook, always include `queryKey`.

**Why:** TanStack Query v5 makes `queryKey` required in `UseQueryOptions`; the generated types enforce this at compile time.

**How to apply:**
```ts
// WRONG — TS2741
useGetEmployee(id, { query: { enabled: isEditing } });

// CORRECT
useGetEmployee(id, { query: { enabled: isEditing, queryKey: getGetEmployeeQueryKey(id) } });
```
Pattern: `queryKey: get<OperationName>QueryKey(args)` — the key getter is always exported alongside the hook.
