import { parse } from "uri-template";
import type { ReferenceApiClientContext } from "./referenceApiClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { jsonCuisineListResponseToApplicationTransform, jsonLocationListResponseToApplicationTransform, jsonPriceCategoryListResponseToApplicationTransform, jsonReservationStatusListResponseToApplicationTransform, jsonUserRoleListResponseToApplicationTransform } from "../../models/internal/serializers.js";
import { CuisineListResponse, LocationListResponse, PriceCategoryListResponse, ReservationStatusListResponse, UserRoleListResponse } from "../../models/models.js";

export interface ListCuisinesOptions extends OperationOptions {

}
export async function listCuisines(
  client: ReferenceApiClientContext,
  options?: ListCuisinesOptions,
): Promise<CuisineListResponse> {
  const path = parse("/api/v1/reference/cuisines").expand({

  });
  const httpRequestOptions = {
    headers: {

    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonCuisineListResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface ListLocationsOptions extends OperationOptions {

}
export async function listLocations(
  client: ReferenceApiClientContext,
  options?: ListLocationsOptions,
): Promise<LocationListResponse> {
  const path = parse("/api/v1/reference/locations").expand({

  });
  const httpRequestOptions = {
    headers: {

    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonLocationListResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface ListPriceCategoriesOptions extends OperationOptions {

}
export async function listPriceCategories(
  client: ReferenceApiClientContext,
  options?: ListPriceCategoriesOptions,
): Promise<PriceCategoryListResponse> {
  const path = parse("/api/v1/reference/price-categories").expand({

  });
  const httpRequestOptions = {
    headers: {

    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonPriceCategoryListResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface ListReservationStatusesOptions extends OperationOptions {

}
export async function listReservationStatuses(
  client: ReferenceApiClientContext,
  options?: ListReservationStatusesOptions,
): Promise<ReservationStatusListResponse> {
  const path = parse("/api/v1/reference/reservation-statuses").expand({

  });
  const httpRequestOptions = {
    headers: {

    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonReservationStatusListResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface ListRolesOptions extends OperationOptions {

}
export async function listRoles(
  client: ReferenceApiClientContext,
  options?: ListRolesOptions,
): Promise<UserRoleListResponse> {
  const path = parse("/api/v1/reference/roles").expand({

  });
  const httpRequestOptions = {
    headers: {

    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonUserRoleListResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;