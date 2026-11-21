export type Role = "TENANT" | "OWNER" | "ADMIN";

export interface AuthUser {
  id: string;
  role: Role;
}
