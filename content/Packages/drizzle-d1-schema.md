# Drizzle + D1 Schema Conventions

- `text('id').primaryKey().$defaultFn(() => crypto.randomUUID())` for UUID PKs
- `integer('col', { mode: 'timestamp' })` for dates — D1 is SQLite, stores as integer epoch
- `text('col', { enum: [...] as const })` for enum-like text columns
- `text('col', { mode: 'json' }).$type<T>()` for flexible JSON columns
- Composite PKs: use `primaryKey({ columns: [table.colA, table.colB] })` in the table's third arg
- Export enum arrays as `const` tuples for runtime validation
