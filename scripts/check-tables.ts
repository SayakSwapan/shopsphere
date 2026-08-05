import { config } from "dotenv";
config({ path: ".env.local", override: true });
config({ path: ".env" });
import { prisma } from "../lib/prisma";
async function main() {
  const r = await prisma.return_request.count();
  const x = await prisma.replacement_request.count();
  console.log("return_request:", r, "replacement_request:", x);
}
main().catch((e) => { console.error(e); process.exit(1); });
