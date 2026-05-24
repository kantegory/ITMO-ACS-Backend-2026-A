import { parse } from "uri-template";
import type { AuthApiClientContext } from "./authApiClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { jsonActionSuccessResponseToApplicationTransform, jsonAuthPayloadToApplicationTransform, jsonLoginRequestToTransportTransform, jsonLoginResponseToApplicationTransform, jsonRegisterRequestToTransportTransform } from "../../models/internal/serializers.js";
import { ActionSuccessResponse, AuthPayload, type LoginRequest, LoginResponse, type RegisterRequest } from "../../models/models.js";

export interface RegisterOptions extends OperationOptions {

}
export async function register(
  client: AuthApiClientContext,
  body: RegisterRequest,
  options?: RegisterOptions,
): Promise<{
  data: AuthPayload;
}> {
  const path = parse("/api/v1/auth/register").expand({

  });
  const httpRequestOptions = {
    headers: {

    },body: jsonRegisterRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return {
      data: jsonAuthPayloadToApplicationTransform(response.body.data)
    }!;
  }
  throw createRestError(response);
}
;
export interface LoginOptions extends OperationOptions {

}
export async function login(
  client: AuthApiClientContext,
  body: LoginRequest,
  options?: LoginOptions,
): Promise<LoginResponse> {
  const path = parse("/api/v1/auth/login").expand({

  });
  const httpRequestOptions = {
    headers: {

    },body: jsonLoginRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonLoginResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface LogoutOptions extends OperationOptions {

}
export async function logout(
  client: AuthApiClientContext,
  authorization: string,
  options?: LogoutOptions,
): Promise<ActionSuccessResponse> {
  const path = parse("/api/v1/auth/logout").expand({

  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonActionSuccessResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;