import { config } from "dotenv";
config({ path: ".env.local", override: true });
config({ path: ".env" });
import { prisma } from "../lib/prisma";
import { createAdminToken, verifyAdminToken } from "../lib/admin-jwt";
async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) { console.error("No admin user found"); process.exit(1); }
  const token = await createAdminToken(admin.id);
  const check = await verifyAdminToken(token);
  console.log("TOKEN:", token);
  console.log("CHECK:", JSON.stringify(check));
}
main().catch((e) => { console.error(e); process.exit(1); });
