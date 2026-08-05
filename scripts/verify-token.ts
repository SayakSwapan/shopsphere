import { verifyAdminToken } from "../lib/admin-jwt";
async function main() {
  const payload = await verifyAdminToken("eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImNtczczYTg1YjAwMDAzOTFreXhqejhsaTYiLCJyb2xlIjoiQURNSU4iLCJleHAiOjE3ODYyNTU2MzJ9.cp4O1I2gNKTwNyAoQDNas3UHSjTATyzmQeXpr3unxzU");
  console.log("VERIFIED:", payload);
}
main().catch((e) => { console.error(e); process.exit(1); });
