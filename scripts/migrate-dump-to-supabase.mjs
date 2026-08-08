import { readFile } from "node:fs/promises";
import pg from "pg";

const DUMP_FILE = "shopsphere-dump.sql";
const MIGRATION_FILE = "prisma/migrations/0_init/migration.sql";

const DB_URL = process.env.SUPABASE_DATABASE_URL || process.argv[2];

function parseMigration(sql) {
  const tables = new Map();
  const re = /CREATE TABLE "([^"]+)" \(([\s\S]*?)^\);/gm;
  let m;
  while ((m = re.exec(sql))) {
    const name = m[1];
    const columns = [];
    for (const line of m[2].split(/\r?\n/)) {
      const cm = line.match(/^\s*"([^"]+)"\s+(.+)$/);
      if (!cm) continue;
      const tokens = cm[2].trim().split(/\s+/);
      const typeParts = [];
      for (const t of tokens) {
        if (/^(NOT|DEFAULT|PRIMARY|CONSTRAINT|REFERENCES)/i.test(t)) break;
        typeParts.push(t);
      }
      if (typeParts.length === 0) continue;
      columns.push({ name: cm[1], type: typeParts.join(" ") });
    }
    tables.set(name, { name, columns, fkParents: new Set() });
  }
  const fkRe = /ALTER TABLE "([^"]+)" ADD CONSTRAINT "[^"]+" FOREIGN KEY \("[^"]+"\) REFERENCES "([^"]+)"/g;
  while ((m = fkRe.exec(sql))) {
    const child = tables.get(m[1]);
    const parent = m[2];
    if (child && parent !== child.name) child.fkParents.add(parent);
  }
  return tables;
}

function topoSort(tables) {
  const ordered = [];
  const visiting = new Set();
  const done = new Set();
  const visit = (name) => {
    if (done.has(name)) return;
    if (visiting.has(name)) throw new Error(`FK cycle detected involving ${name}`);
    visiting.add(name);
    for (const p of tables.get(name).fkParents) {
      if (tables.has(p)) visit(p);
    }
    visiting.delete(name);
    done.add(name);
    ordered.push(name);
  };
  for (const name of tables.keys()) visit(name);
  return ordered;
}

function readQuoted(text, start) {
  let i = start + 1;
  let out = "";
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === "\\") {
      const e = text[i + 1];
      switch (e) {
        case "n": out += "\n"; break;
        case "r": out += "\r"; break;
        case "t": out += "\t"; break;
        case "0": out += "\0"; break;
        case "b": out += "\b"; break;
        case "Z": out += "\x1a"; break;
        case "\\": out += "\\"; break;
        case "'": out += "'"; break;
        case '"': out += '"'; break;
        case "%": out += "%"; break;
        case "_": out += "_"; break;
        default: out += e === undefined ? "\\" : e;
      }
      i += 2;
      continue;
    }
    if (c === "'") {
      if (text[i + 1] === "'") { out += "'"; i += 2; continue; }
      return { value: { kind: "str", text: out }, next: i + 1 };
    }
    out += c;
    i++;
  }
  throw new Error("Unterminated string literal");
}

function parseValue(text, i) {
  const n = text.length;
  const c = text[i];
  if (c === "'") return readQuoted(text, i);
  if (c === "_" && text.startsWith("_binary", i)) {
    let j = i + 7;
    while (j < n && /\s/.test(text[j])) j++;
    if (text[j] === "'") return readQuoted(text, j);
  }
  if (c === "0" && (text[i + 1] === "x" || text[i + 1] === "X")) {
    let j = i + 2;
    while (j < n && /[0-9a-fA-F]/.test(text[j])) j++;
    const buf = Buffer.from(text.slice(i + 2, j), "hex");
    return { value: { kind: "str", text: buf.toString("utf8") }, next: j };
  }
  if (c === "b" && text[i + 1] === "'") {
    let j = i + 2;
    let bits = "";
    while (j < n && text[j] !== "'") { bits += text[j]; j++; }
    j++;
    return { value: { kind: "raw", text: String(parseInt(bits || "0", 2)) }, next: j };
  }
  if (/[A-Za-z]/.test(c)) {
    let j = i;
    while (j < n && /[A-Za-z]/.test(text[j])) j++;
    const word = text.slice(i, j).toUpperCase();
    if (word === "NULL") return { value: { kind: "null" }, next: j };
    if (word === "TRUE") return { value: { kind: "raw", text: "1" }, next: j };
    if (word === "FALSE") return { value: { kind: "raw", text: "0" }, next: j };
    throw new Error(`Unexpected word value "${word}" at index ${i}`);
  }
  let j = i;
  while (j < n && text[j] !== "," && text[j] !== ")") j++;
  const raw = text.slice(i, j).trim();
  if (raw === "") throw new Error(`Empty raw value at index ${i}`);
  return { value: { kind: "raw", text: raw }, next: j };
}

function parseTuple(text, start) {
  const values = [];
  let i = start + 1;
  const n = text.length;
  while (i < n) {
    while (i < n && /\s/.test(text[i])) i++;
    if (i >= n) break;
    const c = text[i];
    if (c === ")") return { values, next: i + 1 };
    if (c === ",") { i++; continue; }
    const v = parseValue(text, i);
    values.push(v.value);
    i = v.next;
  }
  throw new Error("Unterminated tuple");
}

function parseTupleList(text, start) {
  const tuples = [];
  let i = start;
  const n = text.length;
  while (i < n) {
    while (i < n && /\s/.test(text[i])) i++;
    if (i >= n) break;
    if (text[i] === ";") { i++; break; }
    if (text[i] === "(") {
      const res = parseTuple(text, i);
      tuples.push(res.values);
      i = res.next;
      while (i < n && /\s/.test(text[i])) i++;
      if (text[i] === ",") { i++; continue; }
      if (text[i] === ";") { i++; break; }
      throw new Error(`Unexpected char "${text[i]}" after tuple at index ${i}`);
    }
    throw new Error(`Unexpected char "${text[i]}" in VALUES at index ${i}`);
  }
  return { tuples, next: i };
}

function parseDump(text) {
  const tableRows = new Map();
  const n = text.length;
  let i = 0;
  while (i < n) {
    const c = text[i];
    if (c === "-" && text[i + 1] === "-") {
      while (i < n && text[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < n && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (/^INSERT\s+INTO/i.test(text.slice(i, i + 12))) {
      i += 6;
      const intoMatch = /^\s+INTO\s+/i.exec(text.slice(i));
      if (!intoMatch) { i++; continue; }
      i += intoMatch[0].length;
      if (text[i] !== "`") { i++; continue; }
      let j = i + 1;
      while (j < n && text[j] !== "`") j++;
      const tbl = text.slice(i + 1, j);
      i = j + 1;
      const vMatch = /^\s*VALUES/i.exec(text.slice(i));
      if (!vMatch) { i++; continue; }
      i += vMatch[0].length;
      const { tuples, next } = parseTupleList(text, i);
      i = next;
      const rows = tableRows.get(tbl) ?? [];
      rows.push(...tuples);
      tableRows.set(tbl, rows);
      continue;
    }
    i++;
  }
  return tableRows;
}

function parseDumpColumns(sql) {
  const tableColumns = new Map();
  const re = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=[^;]+;/g;
  let m;
  while ((m = re.exec(sql))) {
    const cols = [];
    for (const line of m[2].split(/\r?\n/)) {
      const cm = line.match(/^\s*`([^`]+)`/);
      if (cm) cols.push(cm[1]);
    }
    tableColumns.set(m[1], cols);
  }
  return tableColumns;
}

function convertValue(raw, col) {
  if (raw.kind === "null") return null;
  const s = raw.text;
  if (col.type === "BOOLEAN") {
    return s === "1" || /^true$/i.test(s);
  }
  if (raw.kind === "str") return s;
  if (/^INT\b|^SMALLINT\b|^BIGINT\b|^SERIAL\b/.test(col.type)) return Number(s);
  return s;
}

const DUMP_ONLY = process.argv.includes("--dump-only");

async function main() {
  if (!DB_URL) {
    console.error("Usage: node scripts/migrate-dump-to-supabase.mjs \"<SUPABASE_DATABASE_URL>\"");
    console.error("  (or set SUPABASE_DATABASE_URL env var)");
    process.exit(1);
  }

  const migrationSql = await readFile(MIGRATION_FILE, "utf8");
  const tables = parseMigration(migrationSql);
  console.log(`Parsed ${tables.size} target tables from ${MIGRATION_FILE}`);

  const dumpBuf = await readFile(DUMP_FILE);
  const dumpText = dumpBuf[0] === 0xff && dumpBuf[1] === 0xfe
    ? new TextDecoder("utf-16le").decode(dumpBuf)
    : dumpBuf.toString("utf8");
  const dumpRows = parseDump(dumpText);
  console.log(`Parsed ${dumpRows.size} MySQL tables with INSERT data from ${DUMP_FILE}`);
  const dumpColumns = parseDumpColumns(dumpText);
  console.log(`Parsed column order for ${dumpColumns.size} tables from dump CREATE TABLE`);

  const nameMap = new Map();
  for (const pgName of tables.keys()) nameMap.set(pgName.toLowerCase(), pgName);

  const order = topoSort(tables);
  console.log(`Insert order (FK-aware): ${order.join(", ")}`);

  if (DUMP_ONLY) {
    console.log("\nPer-table row counts (MySQL dump):");
    for (const [mysqlName, rows] of [...dumpRows.entries()].sort()) {
      const pgName = nameMap.get(mysqlName);
      console.log(`  ${pgName ?? `(unmapped: ${mysqlName})`}: ${rows.length}`);
    }
    console.log(`\nTotal parsed rows: ${[...dumpRows.values()].reduce((a, r) => a + r.length, 0)}`);
    return;
  }

  const url = new URL(DB_URL);
  const ssl = url.hostname !== "localhost" && url.hostname !== "127.0.0.1"
    ? { rejectUnauthorized: false }
    : false;
  const client = new pg.Client({ connectionString: DB_URL, ssl });
  await client.connect();
  console.log(`Connected to ${url.hostname}:${url.port || 5432}`);

  if (!DUMP_ONLY) {
    const truncateList = [...order].reverse().map((n) => `"${n}"`).join(", ");
    await client.query(`TRUNCATE TABLE ${truncateList} CASCADE`);
    console.log("Truncated existing rows in target tables\n");
  }

  const skipped = [];
  let totalRows = 0;
  for (const pgName of order) {
    const mysqlName = pgName.toLowerCase();
    const rows = dumpRows.get(mysqlName);
    if (!rows || rows.length === 0) {
      console.log(`SKIP  ${pgName} (no data in dump)`);
      continue;
    }
    const table = tables.get(pgName);
    const dumpCols = dumpColumns.get(mysqlName);
    if (!dumpCols) {
      console.error(`ERROR ${pgName}: no CREATE TABLE found in dump for ${mysqlName}`);
      process.exit(1);
    }
    const typeByCol = new Map(table.columns.map((c) => [c.name.toLowerCase(), c]));
    const converted = [];
    let bad = 0;
    for (const tuple of rows) {
      if (tuple.length !== dumpCols.length) {
        bad++;
        continue;
      }
      const byName = {};
      for (let ci = 0; ci < tuple.length; ci++) {
        const col = typeByCol.get(dumpCols[ci].toLowerCase());
        if (!col) {
          bad++;
          break;
        }
        byName[dumpCols[ci].toLowerCase()] = convertValue(tuple[ci], col);
      }
      if (Object.keys(byName).length !== table.columns.length) {
        bad++;
        continue;
      }
      converted.push(table.columns.map((c) => byName[c.name.toLowerCase()] ?? null));
    }
    if (bad > 0) console.error(`WARN  ${pgName}: ${bad} rows had mismatched columns - skipped those rows`);
    if (converted.length === 0) continue;
    const colCount = table.columns.length;
    const colSql = table.columns.map((c) => `"${c.name}"`).join(", ");
    const chunk = 500;
    for (let start = 0; start < converted.length; start += chunk) {
      const batch = converted.slice(start, start + chunk);
      const placeholders = [];
      const params = [];
      for (let ri = 0; ri < batch.length; ri++) {
        const vals = batch[ri];
        const ps = vals.map((_, ci) => `$${ri * colCount + ci + 1}`).join(", ");
        placeholders.push(`(${ps})`);
        params.push(...vals);
      }
      const sql = `INSERT INTO "${pgName}" (${colSql}) VALUES ${placeholders.join(", ")}`;
      try {
        await client.query(sql, params);
      } catch (err) {
        const sample = JSON.stringify(batch[0]).slice(0, 300);
        console.error(`ERROR ${pgName}: ${err.message}`);
        console.error(`  first row of failing batch: ${sample}`);
        process.exit(1);
      }
    }
    totalRows += converted.length;
    console.log(`DONE  ${pgName}: ${converted.length} rows`);
  }

  console.log(`\nTotal rows inserted: ${totalRows}`);
  if (skipped.length) console.log(`Unmapped dump tables (skipped): ${skipped.join(", ")}`);

  const missing = [];
  for (const t of tables.keys()) if (!dumpRows.has(t.toLowerCase())) missing.push(t);
  console.log(`Tables with no data in dump: ${missing.length ? missing.join(", ") : "(none)"}`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
