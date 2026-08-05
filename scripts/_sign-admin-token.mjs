import { readFileSync } from "fs";
import { SignJWT } from "jose";

const env = readFileSync("F:/PROJECT_FILE/shop/.env.local", "utf8");
const match = env.match(/JWT_SECRET="?([^"\r\n]+)"?/);
if (!match) throw new Error("JWT_SECRET not found");
const secret = new TextEncoder().encode(match[1]);

const id = process.argv[2];
const token = await new SignJWT({ id, role: "ADMIN" })
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("7d")
  .sign(secret);

console.log(token);
