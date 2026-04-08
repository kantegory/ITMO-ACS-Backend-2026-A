import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface UsersApiClientContext extends Client {

}export interface UsersApiClientOptions extends ClientOptions {
  endpoint?: string;
}export function createUsersApiClientContext(
  options?: UsersApiClientOptions,
): UsersApiClientContext {
  const params: Record<string, any> = {
    endpoint: options?.endpoint ?? "/"
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options,
  })
}