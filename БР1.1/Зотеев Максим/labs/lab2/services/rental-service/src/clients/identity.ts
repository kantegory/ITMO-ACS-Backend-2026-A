import { internalCall } from "./http";
import { config } from "../config";

export interface InternalUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "tenant" | "landlord";
  created_at: string;
}

export const getUser = (id: string) =>
  internalCall<InternalUser>(`${config.identityServiceUrl}/api/v1/internal/users/${id}`);

export const batchGetUsers = async (ids: string[]) => {
  if (!ids.length) return new Map<string, InternalUser>();
  const { items } = await internalCall<{ items: InternalUser[] }>(
    `${config.identityServiceUrl}/api/v1/internal/users/batch-get`,
    { method: "POST", body: { ids } }
  );
  return new Map(items.map((u) => [String(u.id), u]));
};
