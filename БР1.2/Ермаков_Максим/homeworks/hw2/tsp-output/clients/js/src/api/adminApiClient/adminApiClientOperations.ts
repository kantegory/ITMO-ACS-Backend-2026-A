import { parse } from "uri-template";
import type { AdminApiClientContext } from "./adminApiClientContext.js";
import { createRestError } from "../../helpers/error.js";
import type { OperationOptions } from "../../helpers/interfaces.js";
import { jsonCreateLocationRequestToTransportTransform, jsonCreateMenuCategoryRequestToTransportTransform, jsonCreateMenuItemRequestToTransportTransform, jsonCreateRestaurantPhotoRequestToTransportTransform, jsonCreateRestaurantRequestToTransportTransform, jsonCreateRestaurantTableRequestToTransportTransform, jsonLocationResponseToApplicationTransform, jsonLocationToApplicationTransform, jsonMenuCategoryResponseToApplicationTransform, jsonMenuCategoryToApplicationTransform, jsonMenuItemResponseToApplicationTransform, jsonMenuItemToApplicationTransform, jsonReservationResponseToApplicationTransform, jsonRestaurantDetailResponseToApplicationTransform, jsonRestaurantDetailToApplicationTransform, jsonRestaurantPhotoResponseToApplicationTransform, jsonRestaurantPhotoToApplicationTransform, jsonRestaurantTableResponseToApplicationTransform, jsonRestaurantTableToApplicationTransform, jsonUpdateLocationRequestToTransportTransform, jsonUpdateMenuCategoryRequestToTransportTransform, jsonUpdateMenuItemRequestToTransportTransform, jsonUpdateReservationStatusRequestToTransportTransform, jsonUpdateRestaurantPhotoRequestToTransportTransform, jsonUpdateRestaurantPublicationRequestToTransportTransform, jsonUpdateRestaurantRequestToTransportTransform, jsonUpdateRestaurantTableRequestToTransportTransform } from "../../models/internal/serializers.js";
import { type CreateLocationRequest, type CreateMenuCategoryRequest, type CreateMenuItemRequest, type CreateRestaurantPhotoRequest, type CreateRestaurantRequest, type CreateRestaurantTableRequest, Location, LocationResponse, MenuCategory, MenuCategoryResponse, MenuItem, MenuItemResponse, ReservationResponse, RestaurantDetail, RestaurantDetailResponse, RestaurantPhoto, RestaurantPhotoResponse, RestaurantTable, RestaurantTableResponse, type UpdateLocationRequest, type UpdateMenuCategoryRequest, type UpdateMenuItemRequest, type UpdateReservationStatusRequest, type UpdateRestaurantPhotoRequest, type UpdateRestaurantPublicationRequest, type UpdateRestaurantRequest, type UpdateRestaurantTableRequest } from "../../models/models.js";

export interface CreateLocationOptions extends OperationOptions {

}
export async function createLocation(
  client: AdminApiClientContext,
  authorization: string,
  body: CreateLocationRequest,
  options?: CreateLocationOptions,
): Promise<{
  data: Location;
}> {
  const path = parse("/api/v1/admin/locations").expand({

  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonCreateLocationRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return {
      data: jsonLocationToApplicationTransform(response.body.data)
    }!;
  }
  throw createRestError(response);
}
;
export interface UpdateLocationOptions extends OperationOptions {

}
export async function updateLocation(
  client: AdminApiClientContext,
  authorization: string,
  locationId: string,
  body: UpdateLocationRequest,
  options?: UpdateLocationOptions,
): Promise<LocationResponse> {
  const path = parse("/api/v1/admin/locations/{locationId}").expand({
    locationId: locationId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateLocationRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonLocationResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateRestaurantOptions extends OperationOptions {

}
export async function createRestaurant(
  client: AdminApiClientContext,
  authorization: string,
  body: CreateRestaurantRequest,
  options?: CreateRestaurantOptions,
): Promise<{
  data: RestaurantDetail;
}> {
  const path = parse("/api/v1/admin/restaurants").expand({

  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonCreateRestaurantRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return {
      data: jsonRestaurantDetailToApplicationTransform(response.body.data)
    }!;
  }
  throw createRestError(response);
}
;
export interface UpdateRestaurantOptions extends OperationOptions {

}
export async function updateRestaurant(
  client: AdminApiClientContext,
  authorization: string,
  restaurantId: string,
  body: UpdateRestaurantRequest,
  options?: UpdateRestaurantOptions,
): Promise<RestaurantDetailResponse> {
  const path = parse("/api/v1/admin/restaurants/{restaurantId}").expand({
    restaurantId: restaurantId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateRestaurantRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);

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
export interface UpdateRestaurantPublicationOptions extends OperationOptions {

}
export async function updateRestaurantPublication(
  client: AdminApiClientContext,
  authorization: string,
  restaurantId: string,
  body: UpdateRestaurantPublicationRequest,
  options?: UpdateRestaurantPublicationOptions,
): Promise<RestaurantDetailResponse> {
  const path = parse("/api/v1/admin/restaurants/{restaurantId}/publication").expand({
    restaurantId: restaurantId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateRestaurantPublicationRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);

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
export interface CreateTableOptions extends OperationOptions {

}
export async function createTable(
  client: AdminApiClientContext,
  authorization: string,
  restaurantId: string,
  body: CreateRestaurantTableRequest,
  options?: CreateTableOptions,
): Promise<{
  data: RestaurantTable;
}> {
  const path = parse("/api/v1/admin/restaurants/{restaurantId}/tables").expand({
    restaurantId: restaurantId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonCreateRestaurantTableRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return {
      data: jsonRestaurantTableToApplicationTransform(response.body.data)
    }!;
  }
  throw createRestError(response);
}
;
export interface UpdateTableOptions extends OperationOptions {

}
export async function updateTable(
  client: AdminApiClientContext,
  authorization: string,
  tableId: string,
  body: UpdateRestaurantTableRequest,
  options?: UpdateTableOptions,
): Promise<RestaurantTableResponse> {
  const path = parse("/api/v1/admin/tables/{tableId}").expand({
    tableId: tableId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateRestaurantTableRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonRestaurantTableResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateMenuCategoryOptions extends OperationOptions {

}
export async function createMenuCategory(
  client: AdminApiClientContext,
  authorization: string,
  restaurantId: string,
  body: CreateMenuCategoryRequest,
  options?: CreateMenuCategoryOptions,
): Promise<{
  data: MenuCategory;
}> {
  const path = parse("/api/v1/admin/restaurants/{restaurantId}/menu-categories").expand({
    restaurantId: restaurantId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonCreateMenuCategoryRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return {
      data: jsonMenuCategoryToApplicationTransform(response.body.data)
    }!;
  }
  throw createRestError(response);
}
;
export interface UpdateMenuCategoryOptions extends OperationOptions {

}
export async function updateMenuCategory(
  client: AdminApiClientContext,
  authorization: string,
  menuCategoryId: string,
  body: UpdateMenuCategoryRequest,
  options?: UpdateMenuCategoryOptions,
): Promise<MenuCategoryResponse> {
  const path = parse("/api/v1/admin/menu-categories/{menuCategoryId}").expand({
    menuCategoryId: menuCategoryId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateMenuCategoryRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonMenuCategoryResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreateMenuItemOptions extends OperationOptions {

}
export async function createMenuItem(
  client: AdminApiClientContext,
  authorization: string,
  menuCategoryId: string,
  body: CreateMenuItemRequest,
  options?: CreateMenuItemOptions,
): Promise<{
  data: MenuItem;
}> {
  const path = parse("/api/v1/admin/menu-categories/{menuCategoryId}/items").expand({
    menuCategoryId: menuCategoryId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonCreateMenuItemRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return {
      data: jsonMenuItemToApplicationTransform(response.body.data)
    }!;
  }
  throw createRestError(response);
}
;
export interface UpdateMenuItemOptions extends OperationOptions {

}
export async function updateMenuItem(
  client: AdminApiClientContext,
  authorization: string,
  menuItemId: string,
  body: UpdateMenuItemRequest,
  options?: UpdateMenuItemOptions,
): Promise<MenuItemResponse> {
  const path = parse("/api/v1/admin/menu-items/{menuItemId}").expand({
    menuItemId: menuItemId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateMenuItemRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonMenuItemResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface CreatePhotoOptions extends OperationOptions {

}
export async function createPhoto(
  client: AdminApiClientContext,
  authorization: string,
  restaurantId: string,
  body: CreateRestaurantPhotoRequest,
  options?: CreatePhotoOptions,
): Promise<{
  data: RestaurantPhoto;
}> {
  const path = parse("/api/v1/admin/restaurants/{restaurantId}/photos").expand({
    restaurantId: restaurantId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonCreateRestaurantPhotoRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 201 && response.headers["content-type"]?.includes("application/json")) {
    return {
      data: jsonRestaurantPhotoToApplicationTransform(response.body.data)
    }!;
  }
  throw createRestError(response);
}
;
export interface UpdatePhotoOptions extends OperationOptions {

}
export async function updatePhoto(
  client: AdminApiClientContext,
  authorization: string,
  photoId: string,
  body: UpdateRestaurantPhotoRequest,
  options?: UpdatePhotoOptions,
): Promise<RestaurantPhotoResponse> {
  const path = parse("/api/v1/admin/photos/{photoId}").expand({
    photoId: photoId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateRestaurantPhotoRequestToTransportTransform(body),
  };
  const response = await client.pathUnchecked(path).patch(httpRequestOptions);

  ;
  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonRestaurantPhotoResponseToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
;
export interface UpdateReservationStatusOptions extends OperationOptions {

}
export async function updateReservationStatus(
  client: AdminApiClientContext,
  authorization: string,
  reservationId: string,
  body: UpdateReservationStatusRequest,
  options?: UpdateReservationStatusOptions,
): Promise<ReservationResponse> {
  const path = parse("/api/v1/admin/reservations/{reservationId}/status").expand({
    reservationId: reservationId
  });
  const httpRequestOptions = {
    headers: {
      authorization: authorization
    },body: jsonUpdateReservationStatusRequestToTransportTransform(body),
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