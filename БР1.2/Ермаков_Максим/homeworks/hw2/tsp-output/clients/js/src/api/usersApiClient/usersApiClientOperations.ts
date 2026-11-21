import { parse } from "uri-template";
import type { UsersApiClientContext } from "./usersApiClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { jsonUpdateUserProfileRequestToTransportTransform, jsonUserProfileResponseToApplicationTransform } from "../../models/internal/serializers.js";
import { type UpdateUserProfileRequest, UserProfileResponse } from "../../models/models.js";

export interface GetProfileOptions extends OperationOptions {

}
export async function getProfile(
  client: UsersApiClientContext,
  authorization: string,
  options?: GetProfileOptions,
): Promise<UserProfileResponse> {
  const path = parse("/api/v1/users/me").expand({

  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUserProfileResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface UpdateProfileOptions extends OperationOptions {

}
export async function updateProfile(
  client: UsersApiClientContext,
  authorization: string,
  body: UpdateUserProfileRequest,
  options?: UpdateProfileOptions,
): Promise<UserProfileResponse> {
  const path = parse("/api/v1/users/me").expand({

  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateUserProfileRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUserProfileResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;