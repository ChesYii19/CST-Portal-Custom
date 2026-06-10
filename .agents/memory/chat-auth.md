---
name: Chat fetch auth headers
description: How to type auth header helpers in frontend fetch calls to avoid TS2769.
---

# Frontend Fetch Auth Headers Pattern

TypeScript rejects spread of `{ Authorization: string } | {}` into `HeadersInit` (TS2769).

**Wrong:**
```ts
const getAuthHeader = () => {
  const token = localStorage.getItem("cst_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
// spread fails: `...getAuthHeader()` is not assignable to HeadersInit
```

**Correct:**
```ts
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("cst_session_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
// Record<string, string> is assignable to HeadersInit
```

**Why:** The union type `{ Authorization: string } | {}` is not narrowable to `HeadersInit` by TS, but `Record<string, string>` is.
