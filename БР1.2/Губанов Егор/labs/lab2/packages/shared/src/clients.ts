import { AppError } from "./errors";
import { internalJson } from "./internal";

export interface UserBrief {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
}

export interface PropertySnapshot {
  id: string;
  owner_id: string;
  type_id: string;
  title: string;
  city: string;
  address: string;
  price: number;
  is_published: boolean;
  type_is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PropertyShortDto {
  id: string;
  owner_id: string;
  type_id: string;
  title: string;
  city: string;
  address: string;
  price: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

function serviceBase(env: string | undefined, fallback: string) {
  return (env || fallback).replace(/\/$/, "");
}

function authBase() {
  return serviceBase(process.env.AUTH_URL, "http://localhost:3001");
}
function catalogBase() {
  return serviceBase(process.env.CATALOG_URL, "http://localhost:3002");
}
function dealsBase() {
  return serviceBase(process.env.DEALS_URL, "http://localhost:3003");
}
function messagingBase() {
  return serviceBase(process.env.MESSAGING_URL, "http://localhost:3004");
}

function internalUrl(base: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}/api/v1${p}`;
}

export async function getUserBrief(id: string): Promise<UserBrief | null> {
  try {
    return await internalJson<UserBrief>(
      internalUrl(authBase(), `/internal/v1/users/${id}`)
    );
  } catch (e) {
    if (e instanceof AppError && e.statusCode === 404) return null;
    throw e;
  }
}

export async function getPropertySnapshot(
  id: string
): Promise<PropertySnapshot | null> {
  try {
    return await internalJson<PropertySnapshot>(
      internalUrl(catalogBase(), `/internal/v1/properties/${id}`)
    );
  } catch (e) {
    if (e instanceof AppError && e.statusCode === 404) return null;
    throw e;
  }
}

export async function listOwnerProperties(
  ownerId: string
): Promise<PropertyShortDto[]> {
  const j = await internalJson<{ items: PropertyShortDto[] }>(
    internalUrl(catalogBase(), `/internal/v1/owners/${ownerId}/properties`)
  );
  return j.items;
}

export async function listUserDealsForHistory(userId: string) {
  return internalJson<{ items: unknown[] }>(
    internalUrl(dealsBase(), `/internal/v1/users/${userId}/deals?limit=200`)
  );
}

export async function listUserMessagesForHistory(userId: string) {
  return internalJson<{ items: unknown[] }>(
    internalUrl(
      messagingBase(),
      `/internal/v1/users/${userId}/messages?limit=200`
    )
  );
}

export async function listOwnerActiveDealsByProperty(ownerId: string) {
  return internalJson<{ by_property: Record<string, unknown[]> }>(
    internalUrl(dealsBase(), `/internal/v1/owners/${ownerId}/active-deals`)
  );
}
