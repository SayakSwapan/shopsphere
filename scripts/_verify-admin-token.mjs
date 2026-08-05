import { readFileSync } from "fs";
import { jwtVerify } from "jose";

const env = readFileSync("F:/PROJECT_FILE/shop/.env.local", "utf8");
const m = env.match(/JWT_SECRET="?([^"\r\n]+)"?/);
const secret = new TextEncoder().encode(m[1]);
const tok = readFileSync("C:/Users/sayak/AppData/Local/Temp/opencode/admin-token.txt", "utf8").trim();
try {
  const r = await jwtVerify(tok, secret);
  console.log("PAYLOAD", JSON.stringify(r.payload));
} catch (e) {
  console.log("VERIFY FAIL", e.message);
}
