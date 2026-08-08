import pg from "pg";
const url = process.env.TEST_URL;
if (!url) { console.error("TEST_URL required"); process.exit(1); }
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const res = await c.query(
  "select tablename from pg_tables where schemaname = 'public' and tablename not like '\\_prisma%' order by tablename"
);
for (const { tablename } of res.rows) {
  const r = await c.query(`select count(*)::int as n from "${tablename}"`);
  console.log(`${tablename}: ${r.rows[0].n}`);
}
await c.end();
