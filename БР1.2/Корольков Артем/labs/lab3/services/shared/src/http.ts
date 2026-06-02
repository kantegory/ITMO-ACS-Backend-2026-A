import { SERVICE_KEY } from './config';

export async function serviceFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('x-service-key', SERVICE_KEY);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...init, headers });
}
