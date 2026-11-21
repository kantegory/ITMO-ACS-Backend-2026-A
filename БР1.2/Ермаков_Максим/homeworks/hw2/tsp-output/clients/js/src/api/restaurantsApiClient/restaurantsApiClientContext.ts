import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface RestaurantsApiClientContext extends Client {

}export interface RestaurantsApiClientOptions extends ClientOptions {
  endpoint?: string;
}export function createRestaurantsApiClientContext(
  options?: RestaurantsApiClientOptions,
): RestaurantsApiClientContext {
  const params: Record<string, any> = {
    endpoint: options?.endpoint ?? "/"
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options,
  })
}