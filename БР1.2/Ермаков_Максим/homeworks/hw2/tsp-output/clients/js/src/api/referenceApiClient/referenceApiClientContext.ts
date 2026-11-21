import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface ReferenceApiClientContext extends Client {

}export interface ReferenceApiClientOptions extends ClientOptions {
  endpoint?: string;
}export function createReferenceApiClientContext(
  options?: ReferenceApiClientOptions,
): ReferenceApiClientContext {
  const params: Record<string, any> = {
    endpoint: options?.endpoint ?? "/"
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options,
  })
}