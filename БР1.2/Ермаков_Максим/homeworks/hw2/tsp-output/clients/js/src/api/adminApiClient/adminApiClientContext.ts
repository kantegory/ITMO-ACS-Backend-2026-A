import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface AdminApiClientContext extends Client {

}export interface AdminApiClientOptions extends ClientOptions {
  endpoint?: string;
}export function createAdminApiClientContext(
  options?: AdminApiClientOptions,
): AdminApiClientContext {
  const params: Record<string, any> = {
    endpoint: options?.endpoint ?? "/"
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options,
  })
}