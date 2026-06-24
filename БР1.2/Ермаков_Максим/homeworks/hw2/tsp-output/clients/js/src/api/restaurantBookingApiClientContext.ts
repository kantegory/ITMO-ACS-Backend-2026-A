import { type Client, type ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface RestaurantBookingApiClientContext extends Client {

}export interface RestaurantBookingApiClientOptions extends ClientOptions {
  endpoint?: string;
}export function createRestaurantBookingApiClientContext(
  options?: RestaurantBookingApiClientOptions,
): RestaurantBookingApiClientContext {
  const params: Record<string, any> = {
    endpoint: options?.endpoint ?? "/"
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    ...options,
  })
}