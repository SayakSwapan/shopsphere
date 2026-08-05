export interface AuthUser {
  userId: string;
  role: "ADMIN" | "PARTNER" | "CUSTOMER";
}