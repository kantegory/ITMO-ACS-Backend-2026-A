import { parse } from "uri-template";
import type { ReservationsApiClientContext } from "./reservationsApiClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { jsonCancelReservationRequestToTransportTransform, jsonCreateReservationRequestToTransportTransform, jsonReservationListQueryToTransportTransform, jsonReservationListResponseToApplicationTransform, jsonReservationResponseToApplicationTransform, jsonReservationToApplicationTransform, jsonUpdateReservationRequestToTransportTransform } from "../../models/internal/serializers.js";
import { type CancelReservationRequest, type CreateReservationRequest, Reservation, type ReservationListQuery, ReservationListResponse, ReservationResponse, type ReservationStatus, type UpdateReservationRequest } from "../../models/models.js";

export interface ListOptions extends OperationOptions {
  status?: ReservationStatus
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  query?: ReservationListQuery
}
export async function list(
  client: ReservationsApiClientContext,
  authorization: string,
  options?: ListOptions,
): Promise<ReservationListResponse> {
  const path = parse("/api/v1/reservations{?query}").expand({
    ...(options?.query && {query: jsonReservationListQueryToTransportTransform(options.query)})
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
    return jsonReservationListResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateOptions extends OperationOptions {

}
export async function create(
  client: ReservationsApiClientContext,
  authorization: string,
  body: CreateReservationRequest,
  options?: CreateOptions,
): Promise<{
  data: Reservation;
}> {
  const path = parse("/api/v1/reservations").expand({

  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonCreateReservationRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return {
      data: jsonReservationToApplicationTransform(response.body.data)
    }!;
  }
  throw createRestError(response);
}
;
export interface GetByIdOptions extends OperationOptions {

}
export async function getById(
  client: ReservationsApiClientContext,
  authorization: string,
  reservationId: string,
  options?: GetByIdOptions,
): Promise<ReservationResponse> {
  const path = parse("/api/v1/reservations/{reservationId}").expand({
    reservationId: reservationId
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
    return jsonReservationResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface UpdateOptions extends OperationOptions {

}
export async function update(
  client: ReservationsApiClientContext,
  authorization: string,
  reservationId: string,
  body: UpdateReservationRequest,
  options?: UpdateOptions,
): Promise<ReservationResponse> {
  const path = parse("/api/v1/reservations/{reservationId}").expand({
    reservationId: reservationId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateReservationRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonReservationResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CancelOptions extends OperationOptions {

}
export async function cancel(
  client: ReservationsApiClientContext,
  authorization: string,
  reservationId: string,
  body: CancelReservationRequest,
  options?: CancelOptions,
): Promise<ReservationResponse> {
  const path = parse("/api/v1/reservations/{reservationId}/cancel").expand({
    reservationId: reservationId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonCancelReservationRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonReservationResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;