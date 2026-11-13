import { parse } from "uri-template";
import type { RestaurantsApiClientContext } from "./restaurantsApiClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { jsonCreateRestaurantReviewRequestToTransportTransform, jsonRestaurantAvailabilityQueryToTransportTransform, jsonRestaurantAvailabilityResponseToApplicationTransform, jsonRestaurantDetailResponseToApplicationTransform, jsonRestaurantListResponseToApplicationTransform, jsonRestaurantMenuResponseToApplicationTransform, jsonRestaurantPhotoListResponseToApplicationTransform, jsonRestaurantReviewListQueryToTransportTransform, jsonRestaurantReviewListResponseToApplicationTransform, jsonRestaurantReviewResponseToApplicationTransform, jsonRestaurantReviewToApplicationTransform, jsonSearchRestaurantsQueryToTransportTransform, jsonUpdateRestaurantReviewRequestToTransportTransform } from "../../models/internal/serializers.js";
import { type CreateRestaurantReviewRequest, type PriceCategory, type RestaurantAvailabilityQuery, RestaurantAvailabilityResponse, RestaurantDetailResponse, RestaurantListResponse, RestaurantMenuResponse, RestaurantPhotoListResponse, RestaurantReview, type RestaurantReviewListQuery, RestaurantReviewListResponse, RestaurantReviewResponse, type SearchRestaurantsQuery, type UpdateRestaurantReviewRequest } from "../../models/models.js";

export interface SearchOptions extends OperationOptions {
  city?: string
  district?: string
  metroStation?: string
  cuisineId?: string
  priceCategory?: PriceCategory
  reservationDate?: string
  reservationTime?: string
  guestsCount?: number
  page?: number
  limit?: number
  filters?: SearchRestaurantsQuery
}
export async function search(
  client: RestaurantsApiClientContext,
  options?: SearchOptions,
): Promise<RestaurantListResponse> {
  const path = parse("/api/v1/restaurants{?filters}").expand({
    ...(options?.filters && {filters: jsonSearchRestaurantsQueryToTransportTransform(options.filters)})
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
    return jsonRestaurantListResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetByIdOptions extends OperationOptions {

}
export async function getById(
  client: RestaurantsApiClientContext,
  restaurantId: string,
  options?: GetByIdOptions,
): Promise<RestaurantDetailResponse> {
  const path = parse("/api/v1/restaurants/{restaurantId}").expand({
    restaurantId: restaurantId
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
    return jsonRestaurantDetailResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetMenuOptions extends OperationOptions {

}
export async function getMenu(
  client: RestaurantsApiClientContext,
  restaurantId: string,
  options?: GetMenuOptions,
): Promise<RestaurantMenuResponse> {
  const path = parse("/api/v1/restaurants/{restaurantId}/menu").expand({
    restaurantId: restaurantId
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
    return jsonRestaurantMenuResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetPhotosOptions extends OperationOptions {

}
export async function getPhotos(
  client: RestaurantsApiClientContext,
  restaurantId: string,
  options?: GetPhotosOptions,
): Promise<RestaurantPhotoListResponse> {
  const path = parse("/api/v1/restaurants/{restaurantId}/photos").expand({
    restaurantId: restaurantId
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
    return jsonRestaurantPhotoListResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetReviewsOptions extends OperationOptions {
  page?: number
  limit?: number
  query?: RestaurantReviewListQuery
}
export async function getReviews(
  client: RestaurantsApiClientContext,
  restaurantId: string,
  options?: GetReviewsOptions,
): Promise<RestaurantReviewListResponse> {
  const path = parse("/api/v1/restaurants/{restaurantId}/reviews{?query}").expand({
    restaurantId: restaurantId,
    ...(options?.query && {query: jsonRestaurantReviewListQueryToTransportTransform(options.query)})
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
    return jsonRestaurantReviewListResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateReviewOptions extends OperationOptions {

}
export async function createReview(
  client: RestaurantsApiClientContext,
  authorization: string,
  restaurantId: string,
  body: CreateRestaurantReviewRequest,
  options?: CreateReviewOptions,
): Promise<{
  data: RestaurantReview;
}> {
  const path = parse("/api/v1/restaurants/{restaurantId}/reviews").expand({
    restaurantId: restaurantId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonCreateRestaurantReviewRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return {
      data: jsonRestaurantReviewToApplicationTransform(response.body.data)
    }!;
  }
  throw createRestError(response);
}
;
export interface UpdateReviewOptions extends OperationOptions {

}
export async function updateReview(
  client: RestaurantsApiClientContext,
  authorization: string,
  restaurantId: string,
  reviewId: string,
  body: UpdateRestaurantReviewRequest,
  options?: UpdateReviewOptions,
): Promise<RestaurantReviewResponse> {
  const path = parse("/api/v1/restaurants/{restaurantId}/reviews/{reviewId}").expand({
    restaurantId: restaurantId,
    reviewId: reviewId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateRestaurantReviewRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonRestaurantReviewResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface GetAvailabilityOptions extends OperationOptions {

}
export async function getAvailability(
  client: RestaurantsApiClientContext,
  restaurantId: string,
  query: RestaurantAvailabilityQuery,
  options?: GetAvailabilityOptions,
): Promise<RestaurantAvailabilityResponse> {
  const path = parse("/api/v1/restaurants/{restaurantId}/availability{?query}").expand({
    restaurantId: restaurantId,
    query: jsonRestaurantAvailabilityQueryToTransportTransform(query)
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
    return jsonRestaurantAvailabilityResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;