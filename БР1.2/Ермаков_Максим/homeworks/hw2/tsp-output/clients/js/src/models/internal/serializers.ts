import { ActionSuccessResponse, AuthPayload, AuthTokenPayload, AuthUser, AvailableTable, CancelReservationRequest, CreateLocationRequest, CreateMenuCategoryRequest, CreateMenuItemRequest, CreateReservationRequest, CreateRestaurantPhotoRequest, CreateRestaurantRequest, CreateRestaurantReviewRequest, CreateRestaurantTableRequest, Cuisine, CuisineListResponse, Location, LocationListResponse, LocationResponse, LoginRequest, LoginResponse, MenuCategory, MenuCategoryResponse, MenuItem, MenuItemResponse, PaginationMeta, PriceCategoryItem, PriceCategoryListResponse, RegisterRequest, Reservation, ReservationListQuery, ReservationListResponse, ReservationResponse, ReservationRestaurantInfo, ReservationStatusItem, ReservationStatusListResponse, ReservationTableInfo, ReservationUserInfo, RestaurantAvailabilityQuery, RestaurantAvailabilityResponse, RestaurantCard, RestaurantDetail, RestaurantDetailResponse, RestaurantListResponse, RestaurantMenuResponse, RestaurantPhoto, RestaurantPhotoListResponse, RestaurantPhotoResponse, RestaurantReview, RestaurantReviewListQuery, RestaurantReviewListResponse, RestaurantReviewResponse, RestaurantTable, RestaurantTableResponse, ReviewAuthor, ReviewsSummary, RoleItem, SearchRestaurantsQuery, UpdateLocationRequest, UpdateMenuCategoryRequest, UpdateMenuItemRequest, UpdateReservationRequest, UpdateReservationStatusRequest, UpdateRestaurantPhotoRequest, UpdateRestaurantPublicationRequest, UpdateRestaurantRequest, UpdateRestaurantReviewRequest, UpdateRestaurantTableRequest, UpdateUserProfileRequest, UserProfile, UserProfileResponse, UserRoleListResponse } from "../models.js";

export function decodeBase64(value: string): Uint8Array | undefined {
  if(!value) {
    return value as any;
  }
  // Normalize Base64URL to Base64
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(value.length + (4 - (value.length % 4)) % 4, '=');

  return new Uint8Array(Buffer.from(base64, 'base64'));
}export function encodeUint8Array(
  value: Uint8Array | undefined | null,
  encoding: BufferEncoding,
): string | undefined {
  if (!value) {
    return value as any;
  }
  return Buffer.from(value).toString(encoding);
}export function dateDeserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}export function dateRfc7231Deserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}export function dateRfc3339Serializer(date?: Date | null): string {
  if (!date) {
    return date as any
  }

  return date.toISOString();
}export function dateRfc7231Serializer(date?: Date | null): string {
  if (!date) {
    return date as any;
  }

  return date.toUTCString();
}export function dateUnixTimestampSerializer(date?: Date | null): number {
  if (!date) {
    return date as any;
  }

  return Math.floor(date.getTime() / 1000);
}export function dateUnixTimestampDeserializer(date?: number | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date * 1000);
}export function createLocationPayloadToTransport(
  payload: CreateLocationRequest,
) {
  return jsonCreateLocationRequestToTransportTransform(payload)!;
}export function updateLocationPayloadToTransport(
  payload: UpdateLocationRequest,
) {
  return jsonUpdateLocationRequestToTransportTransform(payload)!;
}export function createRestaurantPayloadToTransport(
  payload: CreateRestaurantRequest,
) {
  return jsonCreateRestaurantRequestToTransportTransform(payload)!;
}export function updateRestaurantPayloadToTransport(
  payload: UpdateRestaurantRequest,
) {
  return jsonUpdateRestaurantRequestToTransportTransform(payload)!;
}export function updateRestaurantPublicationPayloadToTransport(
  payload: UpdateRestaurantPublicationRequest,
) {
  return jsonUpdateRestaurantPublicationRequestToTransportTransform(payload)!;
}export function createTablePayloadToTransport(
  payload: CreateRestaurantTableRequest,
) {
  return jsonCreateRestaurantTableRequestToTransportTransform(payload)!;
}export function updateTablePayloadToTransport(
  payload: UpdateRestaurantTableRequest,
) {
  return jsonUpdateRestaurantTableRequestToTransportTransform(payload)!;
}export function createMenuCategoryPayloadToTransport(
  payload: CreateMenuCategoryRequest,
) {
  return jsonCreateMenuCategoryRequestToTransportTransform(payload)!;
}export function updateMenuCategoryPayloadToTransport(
  payload: UpdateMenuCategoryRequest,
) {
  return jsonUpdateMenuCategoryRequestToTransportTransform(payload)!;
}export function createMenuItemPayloadToTransport(
  payload: CreateMenuItemRequest,
) {
  return jsonCreateMenuItemRequestToTransportTransform(payload)!;
}export function updateMenuItemPayloadToTransport(
  payload: UpdateMenuItemRequest,
) {
  return jsonUpdateMenuItemRequestToTransportTransform(payload)!;
}export function createPhotoPayloadToTransport(
  payload: CreateRestaurantPhotoRequest,
) {
  return jsonCreateRestaurantPhotoRequestToTransportTransform(payload)!;
}export function updatePhotoPayloadToTransport(
  payload: UpdateRestaurantPhotoRequest,
) {
  return jsonUpdateRestaurantPhotoRequestToTransportTransform(payload)!;
}export function updateReservationStatusPayloadToTransport(
  payload: UpdateReservationStatusRequest,
) {
  return jsonUpdateReservationStatusRequestToTransportTransform(payload)!;
}export function createPayloadToTransport(payload: CreateReservationRequest) {
  return jsonCreateReservationRequestToTransportTransform(payload)!;
}export function updatePayloadToTransport(payload: UpdateReservationRequest) {
  return jsonUpdateReservationRequestToTransportTransform(payload)!;
}export function cancelPayloadToTransport(payload: CancelReservationRequest) {
  return jsonCancelReservationRequestToTransportTransform(payload)!;
}export function createReviewPayloadToTransport(
  payload: CreateRestaurantReviewRequest,
) {
  return jsonCreateRestaurantReviewRequestToTransportTransform(payload)!;
}export function updateReviewPayloadToTransport(
  payload: UpdateRestaurantReviewRequest,
) {
  return jsonUpdateRestaurantReviewRequestToTransportTransform(payload)!;
}export function updateProfilePayloadToTransport(
  payload: UpdateUserProfileRequest,
) {
  return jsonUpdateUserProfileRequestToTransportTransform(payload)!;
}export function registerPayloadToTransport(payload: RegisterRequest) {
  return jsonRegisterRequestToTransportTransform(payload)!;
}export function loginPayloadToTransport(payload: LoginRequest) {
  return jsonLoginRequestToTransportTransform(payload)!;
}export function jsonRegisterRequestToTransportTransform(
  input_?: RegisterRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    firstName: input_.firstName,lastName: input_.lastName,email: input_.email,phone: input_.phone,password: input_.password,passwordConfirmation: input_.passwordConfirmation
  }!;
}export function jsonRegisterRequestToApplicationTransform(
  input_?: any,
): RegisterRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    firstName: input_.firstName,lastName: input_.lastName,email: input_.email,phone: input_.phone,password: input_.password,passwordConfirmation: input_.passwordConfirmation
  }!;
}export function jsonAuthPayloadToTransportTransform(
  input_?: AuthPayload | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    user: jsonAuthUserToTransportTransform(input_.user),tokens: jsonAuthTokenPayloadToTransportTransform(input_.tokens)
  }!;
}export function jsonAuthPayloadToApplicationTransform(
  input_?: any,
): AuthPayload {
  if(!input_) {
    return input_ as any;
  }
    return {
    user: jsonAuthUserToApplicationTransform(input_.user),tokens: jsonAuthTokenPayloadToApplicationTransform(input_.tokens)
  }!;
}export function jsonAuthUserToTransportTransform(
  input_?: AuthUser | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,role: input_.role,firstName: input_.firstName,lastName: input_.lastName,email: input_.email,phone: input_.phone,isVerified: input_.isVerified,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonAuthUserToApplicationTransform(input_?: any): AuthUser {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,role: input_.role,firstName: input_.firstName,lastName: input_.lastName,email: input_.email,phone: input_.phone,isVerified: input_.isVerified,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonAuthTokenPayloadToTransportTransform(
  input_?: AuthTokenPayload | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    accessToken: input_.accessToken,refreshToken: input_.refreshToken,tokenType: input_.tokenType,expiresIn: input_.expiresIn
  }!;
}export function jsonAuthTokenPayloadToApplicationTransform(
  input_?: any,
): AuthTokenPayload {
  if(!input_) {
    return input_ as any;
  }
    return {
    accessToken: input_.accessToken,refreshToken: input_.refreshToken,tokenType: input_.tokenType,expiresIn: input_.expiresIn
  }!;
}export function jsonLoginRequestToTransportTransform(
  input_?: LoginRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    email: input_.email,password: input_.password
  }!;
}export function jsonLoginRequestToApplicationTransform(
  input_?: any,
): LoginRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    email: input_.email,password: input_.password
  }!;
}export function jsonLoginResponseToTransportTransform(
  input_?: LoginResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonAuthPayloadToTransportTransform(input_.data)
  }!;
}export function jsonLoginResponseToApplicationTransform(
  input_?: any,
): LoginResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonAuthPayloadToApplicationTransform(input_.data)
  }!;
}export function jsonActionSuccessResponseToTransportTransform(
  input_?: ActionSuccessResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    message: input_.message
  }!;
}export function jsonActionSuccessResponseToApplicationTransform(
  input_?: any,
): ActionSuccessResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    message: input_.message
  }!;
}export function jsonUserProfileResponseToTransportTransform(
  input_?: UserProfileResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonUserProfileToTransportTransform(input_.data)
  }!;
}export function jsonUserProfileResponseToApplicationTransform(
  input_?: any,
): UserProfileResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonUserProfileToApplicationTransform(input_.data)
  }!;
}export function jsonUserProfileToTransportTransform(
  input_?: UserProfile | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,role: input_.role,firstName: input_.firstName,lastName: input_.lastName,email: input_.email,phone: input_.phone,isVerified: input_.isVerified,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonUserProfileToApplicationTransform(
  input_?: any,
): UserProfile {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,role: input_.role,firstName: input_.firstName,lastName: input_.lastName,email: input_.email,phone: input_.phone,isVerified: input_.isVerified,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonUpdateUserProfileRequestToTransportTransform(
  input_?: UpdateUserProfileRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    firstName: input_.firstName,lastName: input_.lastName,phone: input_.phone,currentPassword: input_.currentPassword,password: input_.password
  }!;
}export function jsonUpdateUserProfileRequestToApplicationTransform(
  input_?: any,
): UpdateUserProfileRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    firstName: input_.firstName,lastName: input_.lastName,phone: input_.phone,currentPassword: input_.currentPassword,password: input_.password
  }!;
}export function jsonCuisineListResponseToTransportTransform(
  input_?: CuisineListResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayCuisineToTransportTransform(input_.data)
  }!;
}export function jsonCuisineListResponseToApplicationTransform(
  input_?: any,
): CuisineListResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayCuisineToApplicationTransform(input_.data)
  }!;
}export function jsonArrayCuisineToTransportTransform(
  items_?: Array<Cuisine> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonCuisineToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayCuisineToApplicationTransform(
  items_?: any,
): Array<Cuisine> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonCuisineToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonCuisineToTransportTransform(input_?: Cuisine | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,title: input_.title,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonCuisineToApplicationTransform(input_?: any): Cuisine {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,title: input_.title,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonLocationListResponseToTransportTransform(
  input_?: LocationListResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayLocationToTransportTransform(input_.data)
  }!;
}export function jsonLocationListResponseToApplicationTransform(
  input_?: any,
): LocationListResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayLocationToApplicationTransform(input_.data)
  }!;
}export function jsonArrayLocationToTransportTransform(
  items_?: Array<Location> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonLocationToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayLocationToApplicationTransform(
  items_?: any,
): Array<Location> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonLocationToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonLocationToTransportTransform(
  input_?: Location | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,city: input_.city,address: input_.address,district: input_.district,metroStation: input_.metroStation,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonLocationToApplicationTransform(input_?: any): Location {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,city: input_.city,address: input_.address,district: input_.district,metroStation: input_.metroStation,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonPriceCategoryListResponseToTransportTransform(
  input_?: PriceCategoryListResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayPriceCategoryItemToTransportTransform(input_.data)
  }!;
}export function jsonPriceCategoryListResponseToApplicationTransform(
  input_?: any,
): PriceCategoryListResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayPriceCategoryItemToApplicationTransform(input_.data)
  }!;
}export function jsonArrayPriceCategoryItemToTransportTransform(
  items_?: Array<PriceCategoryItem> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonPriceCategoryItemToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayPriceCategoryItemToApplicationTransform(
  items_?: any,
): Array<PriceCategoryItem> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonPriceCategoryItemToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonPriceCategoryItemToTransportTransform(
  input_?: PriceCategoryItem | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,label: input_.label
  }!;
}export function jsonPriceCategoryItemToApplicationTransform(
  input_?: any,
): PriceCategoryItem {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,label: input_.label
  }!;
}export function jsonReservationStatusListResponseToTransportTransform(
  input_?: ReservationStatusListResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayReservationStatusItemToTransportTransform(input_.data)
  }!;
}export function jsonReservationStatusListResponseToApplicationTransform(
  input_?: any,
): ReservationStatusListResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayReservationStatusItemToApplicationTransform(input_.data)
  }!;
}export function jsonArrayReservationStatusItemToTransportTransform(
  items_?: Array<ReservationStatusItem> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonReservationStatusItemToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayReservationStatusItemToApplicationTransform(
  items_?: any,
): Array<ReservationStatusItem> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonReservationStatusItemToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonReservationStatusItemToTransportTransform(
  input_?: ReservationStatusItem | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,label: input_.label
  }!;
}export function jsonReservationStatusItemToApplicationTransform(
  input_?: any,
): ReservationStatusItem {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,label: input_.label
  }!;
}export function jsonUserRoleListResponseToTransportTransform(
  input_?: UserRoleListResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayRoleItemToTransportTransform(input_.data)
  }!;
}export function jsonUserRoleListResponseToApplicationTransform(
  input_?: any,
): UserRoleListResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayRoleItemToApplicationTransform(input_.data)
  }!;
}export function jsonArrayRoleItemToTransportTransform(
  items_?: Array<RoleItem> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRoleItemToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayRoleItemToApplicationTransform(
  items_?: any,
): Array<RoleItem> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRoleItemToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonRoleItemToTransportTransform(
  input_?: RoleItem | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,label: input_.label
  }!;
}export function jsonRoleItemToApplicationTransform(input_?: any): RoleItem {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,label: input_.label
  }!;
}export function jsonSearchRestaurantsQueryToTransportTransform(
  input_?: SearchRestaurantsQuery | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    city: input_.city,district: input_.district,metroStation: input_.metroStation,cuisineId: input_.cuisineId,priceCategory: input_.priceCategory,reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount,page: input_.page,limit: input_.limit
  }!;
}export function jsonSearchRestaurantsQueryToApplicationTransform(
  input_?: any,
): SearchRestaurantsQuery {
  if(!input_) {
    return input_ as any;
  }
    return {
    city: input_.city,district: input_.district,metroStation: input_.metroStation,cuisineId: input_.cuisineId,priceCategory: input_.priceCategory,reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount,page: input_.page,limit: input_.limit
  }!;
}export function jsonRestaurantListResponseToTransportTransform(
  input_?: RestaurantListResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayRestaurantCardToTransportTransform(input_.data),meta: jsonPaginationMetaToTransportTransform(input_.meta)
  }!;
}export function jsonRestaurantListResponseToApplicationTransform(
  input_?: any,
): RestaurantListResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayRestaurantCardToApplicationTransform(input_.data),meta: jsonPaginationMetaToApplicationTransform(input_.meta)
  }!;
}export function jsonArrayRestaurantCardToTransportTransform(
  items_?: Array<RestaurantCard> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRestaurantCardToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayRestaurantCardToApplicationTransform(
  items_?: any,
): Array<RestaurantCard> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRestaurantCardToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonRestaurantCardToTransportTransform(
  input_?: RestaurantCard | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,title: input_.title,description: input_.description,phone: input_.phone,email: input_.email,openTime: input_.openTime,closeTime: input_.closeTime,avgRating: input_.avgRating,priceCategory: input_.priceCategory,location: jsonLocationToTransportTransform(input_.location),cuisines: jsonArrayCuisineToTransportTransform(input_.cuisines),mainPhoto: jsonRestaurantPhotoToTransportTransform(input_.mainPhoto)
  }!;
}export function jsonRestaurantCardToApplicationTransform(
  input_?: any,
): RestaurantCard {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,title: input_.title,description: input_.description,phone: input_.phone,email: input_.email,openTime: input_.openTime,closeTime: input_.closeTime,avgRating: input_.avgRating,priceCategory: input_.priceCategory,location: jsonLocationToApplicationTransform(input_.location),cuisines: jsonArrayCuisineToApplicationTransform(input_.cuisines),mainPhoto: jsonRestaurantPhotoToApplicationTransform(input_.mainPhoto)
  }!;
}export function jsonRestaurantPhotoToTransportTransform(
  input_?: RestaurantPhoto | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,imageUrl: input_.imageUrl,isMain: input_.isMain,createdAt: input_.createdAt
  }!;
}export function jsonRestaurantPhotoToApplicationTransform(
  input_?: any,
): RestaurantPhoto {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,imageUrl: input_.imageUrl,isMain: input_.isMain,createdAt: input_.createdAt
  }!;
}export function jsonRestaurantDetailToTransportTransform(
  input_?: RestaurantDetail | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    isPublished: input_.isPublished,tables: jsonArrayRestaurantTableToTransportTransform(input_.tables),photos: jsonArrayRestaurantPhotoToTransportTransform(input_.photos),menu: jsonArrayMenuCategoryToTransportTransform(input_.menu),reviewsSummary: jsonReviewsSummaryToTransportTransform(input_.reviewsSummary),createdAt: input_.createdAt,updatedAt: input_.updatedAt,id: input_.id,title: input_.title,description: input_.description,phone: input_.phone,email: input_.email,openTime: input_.openTime,closeTime: input_.closeTime,avgRating: input_.avgRating,priceCategory: input_.priceCategory,location: jsonLocationToTransportTransform(input_.location),cuisines: jsonArrayCuisineToTransportTransform(input_.cuisines),mainPhoto: jsonRestaurantPhotoToTransportTransform(input_.mainPhoto)
  }!;
}export function jsonRestaurantDetailToApplicationTransform(
  input_?: any,
): RestaurantDetail {
  if(!input_) {
    return input_ as any;
  }
    return {
    isPublished: input_.isPublished,tables: jsonArrayRestaurantTableToApplicationTransform(input_.tables),photos: jsonArrayRestaurantPhotoToApplicationTransform(input_.photos),menu: jsonArrayMenuCategoryToApplicationTransform(input_.menu),reviewsSummary: jsonReviewsSummaryToApplicationTransform(input_.reviewsSummary),createdAt: input_.createdAt,updatedAt: input_.updatedAt,id: input_.id,title: input_.title,description: input_.description,phone: input_.phone,email: input_.email,openTime: input_.openTime,closeTime: input_.closeTime,avgRating: input_.avgRating,priceCategory: input_.priceCategory,location: jsonLocationToApplicationTransform(input_.location),cuisines: jsonArrayCuisineToApplicationTransform(input_.cuisines),mainPhoto: jsonRestaurantPhotoToApplicationTransform(input_.mainPhoto)
  }!;
}export function jsonArrayRestaurantTableToTransportTransform(
  items_?: Array<RestaurantTable> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRestaurantTableToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayRestaurantTableToApplicationTransform(
  items_?: any,
): Array<RestaurantTable> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRestaurantTableToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonRestaurantTableToTransportTransform(
  input_?: RestaurantTable | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,tableNumber: input_.tableNumber,capacity: input_.capacity,isActive: input_.isActive,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonRestaurantTableToApplicationTransform(
  input_?: any,
): RestaurantTable {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,tableNumber: input_.tableNumber,capacity: input_.capacity,isActive: input_.isActive,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonArrayRestaurantPhotoToTransportTransform(
  items_?: Array<RestaurantPhoto> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRestaurantPhotoToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayRestaurantPhotoToApplicationTransform(
  items_?: any,
): Array<RestaurantPhoto> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRestaurantPhotoToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayMenuCategoryToTransportTransform(
  items_?: Array<MenuCategory> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonMenuCategoryToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayMenuCategoryToApplicationTransform(
  items_?: any,
): Array<MenuCategory> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonMenuCategoryToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonMenuCategoryToTransportTransform(
  input_?: MenuCategory | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,restaurantId: input_.restaurantId,title: input_.title,items: jsonArrayMenuItemToTransportTransform(input_.items),createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonMenuCategoryToApplicationTransform(
  input_?: any,
): MenuCategory {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,restaurantId: input_.restaurantId,title: input_.title,items: jsonArrayMenuItemToApplicationTransform(input_.items),createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonArrayMenuItemToTransportTransform(
  items_?: Array<MenuItem> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonMenuItemToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayMenuItemToApplicationTransform(
  items_?: any,
): Array<MenuItem> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonMenuItemToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonMenuItemToTransportTransform(
  input_?: MenuItem | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,title: input_.title,description: input_.description,price: input_.price,weight: input_.weight,isAvailable: input_.isAvailable,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonMenuItemToApplicationTransform(input_?: any): MenuItem {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,title: input_.title,description: input_.description,price: input_.price,weight: input_.weight,isAvailable: input_.isAvailable,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonReviewsSummaryToTransportTransform(
  input_?: ReviewsSummary | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    totalReviews: input_.totalReviews,avgRating: input_.avgRating
  }!;
}export function jsonReviewsSummaryToApplicationTransform(
  input_?: any,
): ReviewsSummary {
  if(!input_) {
    return input_ as any;
  }
    return {
    totalReviews: input_.totalReviews,avgRating: input_.avgRating
  }!;
}export function jsonPaginationMetaToTransportTransform(
  input_?: PaginationMeta | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    page: input_.page,limit: input_.limit,totalItems: input_.totalItems,totalPages: input_.totalPages
  }!;
}export function jsonPaginationMetaToApplicationTransform(
  input_?: any,
): PaginationMeta {
  if(!input_) {
    return input_ as any;
  }
    return {
    page: input_.page,limit: input_.limit,totalItems: input_.totalItems,totalPages: input_.totalPages
  }!;
}export function jsonRestaurantDetailResponseToTransportTransform(
  input_?: RestaurantDetailResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonRestaurantDetailToTransportTransform(input_.data)
  }!;
}export function jsonRestaurantDetailResponseToApplicationTransform(
  input_?: any,
): RestaurantDetailResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonRestaurantDetailToApplicationTransform(input_.data)
  }!;
}export function jsonRestaurantMenuResponseToTransportTransform(
  input_?: RestaurantMenuResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    restaurantId: input_.restaurantId,data: jsonArrayMenuCategoryToTransportTransform(input_.data)
  }!;
}export function jsonRestaurantMenuResponseToApplicationTransform(
  input_?: any,
): RestaurantMenuResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    restaurantId: input_.restaurantId,data: jsonArrayMenuCategoryToApplicationTransform(input_.data)
  }!;
}export function jsonRestaurantPhotoListResponseToTransportTransform(
  input_?: RestaurantPhotoListResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    restaurantId: input_.restaurantId,data: jsonArrayRestaurantPhotoToTransportTransform(input_.data)
  }!;
}export function jsonRestaurantPhotoListResponseToApplicationTransform(
  input_?: any,
): RestaurantPhotoListResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    restaurantId: input_.restaurantId,data: jsonArrayRestaurantPhotoToApplicationTransform(input_.data)
  }!;
}export function jsonRestaurantReviewListQueryToTransportTransform(
  input_?: RestaurantReviewListQuery | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    page: input_.page,limit: input_.limit
  }!;
}export function jsonRestaurantReviewListQueryToApplicationTransform(
  input_?: any,
): RestaurantReviewListQuery {
  if(!input_) {
    return input_ as any;
  }
    return {
    page: input_.page,limit: input_.limit
  }!;
}export function jsonRestaurantReviewListResponseToTransportTransform(
  input_?: RestaurantReviewListResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayRestaurantReviewToTransportTransform(input_.data),meta: jsonPaginationMetaToTransportTransform(input_.meta)
  }!;
}export function jsonRestaurantReviewListResponseToApplicationTransform(
  input_?: any,
): RestaurantReviewListResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayRestaurantReviewToApplicationTransform(input_.data),meta: jsonPaginationMetaToApplicationTransform(input_.meta)
  }!;
}export function jsonArrayRestaurantReviewToTransportTransform(
  items_?: Array<RestaurantReview> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRestaurantReviewToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayRestaurantReviewToApplicationTransform(
  items_?: any,
): Array<RestaurantReview> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRestaurantReviewToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonRestaurantReviewToTransportTransform(
  input_?: RestaurantReview | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,user: jsonReviewAuthorToTransportTransform(input_.user),rating: input_.rating,comment: input_.comment,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonRestaurantReviewToApplicationTransform(
  input_?: any,
): RestaurantReview {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,user: jsonReviewAuthorToApplicationTransform(input_.user),rating: input_.rating,comment: input_.comment,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonReviewAuthorToTransportTransform(
  input_?: ReviewAuthor | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,firstName: input_.firstName,lastName: input_.lastName
  }!;
}export function jsonReviewAuthorToApplicationTransform(
  input_?: any,
): ReviewAuthor {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,firstName: input_.firstName,lastName: input_.lastName
  }!;
}export function jsonCreateRestaurantReviewRequestToTransportTransform(
  input_?: CreateRestaurantReviewRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    rating: input_.rating,comment: input_.comment
  }!;
}export function jsonCreateRestaurantReviewRequestToApplicationTransform(
  input_?: any,
): CreateRestaurantReviewRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    rating: input_.rating,comment: input_.comment
  }!;
}export function jsonUpdateRestaurantReviewRequestToTransportTransform(
  input_?: UpdateRestaurantReviewRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    rating: input_.rating,comment: input_.comment
  }!;
}export function jsonUpdateRestaurantReviewRequestToApplicationTransform(
  input_?: any,
): UpdateRestaurantReviewRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    rating: input_.rating,comment: input_.comment
  }!;
}export function jsonRestaurantReviewResponseToTransportTransform(
  input_?: RestaurantReviewResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonRestaurantReviewToTransportTransform(input_.data)
  }!;
}export function jsonRestaurantReviewResponseToApplicationTransform(
  input_?: any,
): RestaurantReviewResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonRestaurantReviewToApplicationTransform(input_.data)
  }!;
}export function jsonRestaurantAvailabilityQueryToTransportTransform(
  input_?: RestaurantAvailabilityQuery | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount
  }!;
}export function jsonRestaurantAvailabilityQueryToApplicationTransform(
  input_?: any,
): RestaurantAvailabilityQuery {
  if(!input_) {
    return input_ as any;
  }
    return {
    reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount
  }!;
}export function jsonRestaurantAvailabilityResponseToTransportTransform(
  input_?: RestaurantAvailabilityResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    restaurantId: input_.restaurantId,reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount,data: jsonArrayAvailableTableToTransportTransform(input_.data)
  }!;
}export function jsonRestaurantAvailabilityResponseToApplicationTransform(
  input_?: any,
): RestaurantAvailabilityResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    restaurantId: input_.restaurantId,reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount,data: jsonArrayAvailableTableToApplicationTransform(input_.data)
  }!;
}export function jsonArrayAvailableTableToTransportTransform(
  items_?: Array<AvailableTable> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonAvailableTableToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayAvailableTableToApplicationTransform(
  items_?: any,
): Array<AvailableTable> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonAvailableTableToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonAvailableTableToTransportTransform(
  input_?: AvailableTable | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,tableNumber: input_.tableNumber,capacity: input_.capacity
  }!;
}export function jsonAvailableTableToApplicationTransform(
  input_?: any,
): AvailableTable {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,tableNumber: input_.tableNumber,capacity: input_.capacity
  }!;
}export function jsonReservationListQueryToTransportTransform(
  input_?: ReservationListQuery | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    status: input_.status,fromDate: input_.fromDate,toDate: input_.toDate,page: input_.page,limit: input_.limit
  }!;
}export function jsonReservationListQueryToApplicationTransform(
  input_?: any,
): ReservationListQuery {
  if(!input_) {
    return input_ as any;
  }
    return {
    status: input_.status,fromDate: input_.fromDate,toDate: input_.toDate,page: input_.page,limit: input_.limit
  }!;
}export function jsonReservationListResponseToTransportTransform(
  input_?: ReservationListResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayReservationToTransportTransform(input_.data),meta: jsonPaginationMetaToTransportTransform(input_.meta)
  }!;
}export function jsonReservationListResponseToApplicationTransform(
  input_?: any,
): ReservationListResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonArrayReservationToApplicationTransform(input_.data),meta: jsonPaginationMetaToApplicationTransform(input_.meta)
  }!;
}export function jsonArrayReservationToTransportTransform(
  items_?: Array<Reservation> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonReservationToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayReservationToApplicationTransform(
  items_?: any,
): Array<Reservation> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonReservationToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonReservationToTransportTransform(
  input_?: Reservation | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,user: jsonReservationUserInfoToTransportTransform(input_.user),restaurant: jsonReservationRestaurantInfoToTransportTransform(input_.restaurant),table: jsonReservationTableInfoToTransportTransform(input_.table),status: input_.status,reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount,comment: input_.comment,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonReservationToApplicationTransform(
  input_?: any,
): Reservation {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,user: jsonReservationUserInfoToApplicationTransform(input_.user),restaurant: jsonReservationRestaurantInfoToApplicationTransform(input_.restaurant),table: jsonReservationTableInfoToApplicationTransform(input_.table),status: input_.status,reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount,comment: input_.comment,createdAt: input_.createdAt,updatedAt: input_.updatedAt
  }!;
}export function jsonReservationUserInfoToTransportTransform(
  input_?: ReservationUserInfo | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,firstName: input_.firstName,lastName: input_.lastName,email: input_.email,phone: input_.phone
  }!;
}export function jsonReservationUserInfoToApplicationTransform(
  input_?: any,
): ReservationUserInfo {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,firstName: input_.firstName,lastName: input_.lastName,email: input_.email,phone: input_.phone
  }!;
}export function jsonReservationRestaurantInfoToTransportTransform(
  input_?: ReservationRestaurantInfo | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,title: input_.title,location: jsonLocationToTransportTransform(input_.location)
  }!;
}export function jsonReservationRestaurantInfoToApplicationTransform(
  input_?: any,
): ReservationRestaurantInfo {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,title: input_.title,location: jsonLocationToApplicationTransform(input_.location)
  }!;
}export function jsonReservationTableInfoToTransportTransform(
  input_?: ReservationTableInfo | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,tableNumber: input_.tableNumber,capacity: input_.capacity
  }!;
}export function jsonReservationTableInfoToApplicationTransform(
  input_?: any,
): ReservationTableInfo {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,tableNumber: input_.tableNumber,capacity: input_.capacity
  }!;
}export function jsonCreateReservationRequestToTransportTransform(
  input_?: CreateReservationRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    restaurantId: input_.restaurantId,tableId: input_.tableId,reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount,comment: input_.comment
  }!;
}export function jsonCreateReservationRequestToApplicationTransform(
  input_?: any,
): CreateReservationRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    restaurantId: input_.restaurantId,tableId: input_.tableId,reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount,comment: input_.comment
  }!;
}export function jsonReservationResponseToTransportTransform(
  input_?: ReservationResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonReservationToTransportTransform(input_.data)
  }!;
}export function jsonReservationResponseToApplicationTransform(
  input_?: any,
): ReservationResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonReservationToApplicationTransform(input_.data)
  }!;
}export function jsonUpdateReservationRequestToTransportTransform(
  input_?: UpdateReservationRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    tableId: input_.tableId,reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount,comment: input_.comment
  }!;
}export function jsonUpdateReservationRequestToApplicationTransform(
  input_?: any,
): UpdateReservationRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    tableId: input_.tableId,reservationDate: input_.reservationDate,reservationTime: input_.reservationTime,guestsCount: input_.guestsCount,comment: input_.comment
  }!;
}export function jsonCancelReservationRequestToTransportTransform(
  input_?: CancelReservationRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    reason: input_.reason
  }!;
}export function jsonCancelReservationRequestToApplicationTransform(
  input_?: any,
): CancelReservationRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    reason: input_.reason
  }!;
}export function jsonCreateLocationRequestToTransportTransform(
  input_?: CreateLocationRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    city: input_.city,address: input_.address,district: input_.district,metroStation: input_.metroStation
  }!;
}export function jsonCreateLocationRequestToApplicationTransform(
  input_?: any,
): CreateLocationRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    city: input_.city,address: input_.address,district: input_.district,metroStation: input_.metroStation
  }!;
}export function jsonUpdateLocationRequestToTransportTransform(
  input_?: UpdateLocationRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    city: input_.city,address: input_.address,district: input_.district,metroStation: input_.metroStation
  }!;
}export function jsonUpdateLocationRequestToApplicationTransform(
  input_?: any,
): UpdateLocationRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    city: input_.city,address: input_.address,district: input_.district,metroStation: input_.metroStation
  }!;
}export function jsonLocationResponseToTransportTransform(
  input_?: LocationResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonLocationToTransportTransform(input_.data)
  }!;
}export function jsonLocationResponseToApplicationTransform(
  input_?: any,
): LocationResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonLocationToApplicationTransform(input_.data)
  }!;
}export function jsonCreateRestaurantRequestToTransportTransform(
  input_?: CreateRestaurantRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    locationId: input_.locationId,priceCategory: input_.priceCategory,title: input_.title,description: input_.description,phone: input_.phone,email: input_.email,openTime: input_.openTime,closeTime: input_.closeTime,cuisineIds: jsonArrayStringToTransportTransform(input_.cuisineIds),isPublished: input_.isPublished
  }!;
}export function jsonCreateRestaurantRequestToApplicationTransform(
  input_?: any,
): CreateRestaurantRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    locationId: input_.locationId,priceCategory: input_.priceCategory,title: input_.title,description: input_.description,phone: input_.phone,email: input_.email,openTime: input_.openTime,closeTime: input_.closeTime,cuisineIds: jsonArrayStringToApplicationTransform(input_.cuisineIds),isPublished: input_.isPublished
  }!;
}export function jsonArrayStringToTransportTransform(
  items_?: Array<string> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = item as any;
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayStringToApplicationTransform(
  items_?: any,
): Array<string> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = item as any;
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonUpdateRestaurantRequestToTransportTransform(
  input_?: UpdateRestaurantRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    locationId: input_.locationId,priceCategory: input_.priceCategory,title: input_.title,description: input_.description,phone: input_.phone,email: input_.email,openTime: input_.openTime,closeTime: input_.closeTime,cuisineIds: jsonArrayStringToTransportTransform(input_.cuisineIds)
  }!;
}export function jsonUpdateRestaurantRequestToApplicationTransform(
  input_?: any,
): UpdateRestaurantRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    locationId: input_.locationId,priceCategory: input_.priceCategory,title: input_.title,description: input_.description,phone: input_.phone,email: input_.email,openTime: input_.openTime,closeTime: input_.closeTime,cuisineIds: jsonArrayStringToApplicationTransform(input_.cuisineIds)
  }!;
}export function jsonUpdateRestaurantPublicationRequestToTransportTransform(
  input_?: UpdateRestaurantPublicationRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    isPublished: input_.isPublished
  }!;
}export function jsonUpdateRestaurantPublicationRequestToApplicationTransform(
  input_?: any,
): UpdateRestaurantPublicationRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    isPublished: input_.isPublished
  }!;
}export function jsonCreateRestaurantTableRequestToTransportTransform(
  input_?: CreateRestaurantTableRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    tableNumber: input_.tableNumber,capacity: input_.capacity,isActive: input_.isActive
  }!;
}export function jsonCreateRestaurantTableRequestToApplicationTransform(
  input_?: any,
): CreateRestaurantTableRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    tableNumber: input_.tableNumber,capacity: input_.capacity,isActive: input_.isActive
  }!;
}export function jsonUpdateRestaurantTableRequestToTransportTransform(
  input_?: UpdateRestaurantTableRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    tableNumber: input_.tableNumber,capacity: input_.capacity,isActive: input_.isActive
  }!;
}export function jsonUpdateRestaurantTableRequestToApplicationTransform(
  input_?: any,
): UpdateRestaurantTableRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    tableNumber: input_.tableNumber,capacity: input_.capacity,isActive: input_.isActive
  }!;
}export function jsonRestaurantTableResponseToTransportTransform(
  input_?: RestaurantTableResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonRestaurantTableToTransportTransform(input_.data)
  }!;
}export function jsonRestaurantTableResponseToApplicationTransform(
  input_?: any,
): RestaurantTableResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonRestaurantTableToApplicationTransform(input_.data)
  }!;
}export function jsonCreateMenuCategoryRequestToTransportTransform(
  input_?: CreateMenuCategoryRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    title: input_.title
  }!;
}export function jsonCreateMenuCategoryRequestToApplicationTransform(
  input_?: any,
): CreateMenuCategoryRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    title: input_.title
  }!;
}export function jsonUpdateMenuCategoryRequestToTransportTransform(
  input_?: UpdateMenuCategoryRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    title: input_.title
  }!;
}export function jsonUpdateMenuCategoryRequestToApplicationTransform(
  input_?: any,
): UpdateMenuCategoryRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    title: input_.title
  }!;
}export function jsonMenuCategoryResponseToTransportTransform(
  input_?: MenuCategoryResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonMenuCategoryToTransportTransform(input_.data)
  }!;
}export function jsonMenuCategoryResponseToApplicationTransform(
  input_?: any,
): MenuCategoryResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonMenuCategoryToApplicationTransform(input_.data)
  }!;
}export function jsonCreateMenuItemRequestToTransportTransform(
  input_?: CreateMenuItemRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    title: input_.title,description: input_.description,price: input_.price,weight: input_.weight,isAvailable: input_.isAvailable
  }!;
}export function jsonCreateMenuItemRequestToApplicationTransform(
  input_?: any,
): CreateMenuItemRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    title: input_.title,description: input_.description,price: input_.price,weight: input_.weight,isAvailable: input_.isAvailable
  }!;
}export function jsonUpdateMenuItemRequestToTransportTransform(
  input_?: UpdateMenuItemRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    title: input_.title,description: input_.description,price: input_.price,weight: input_.weight,isAvailable: input_.isAvailable
  }!;
}export function jsonUpdateMenuItemRequestToApplicationTransform(
  input_?: any,
): UpdateMenuItemRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    title: input_.title,description: input_.description,price: input_.price,weight: input_.weight,isAvailable: input_.isAvailable
  }!;
}export function jsonMenuItemResponseToTransportTransform(
  input_?: MenuItemResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonMenuItemToTransportTransform(input_.data)
  }!;
}export function jsonMenuItemResponseToApplicationTransform(
  input_?: any,
): MenuItemResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonMenuItemToApplicationTransform(input_.data)
  }!;
}export function jsonCreateRestaurantPhotoRequestToTransportTransform(
  input_?: CreateRestaurantPhotoRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    imageUrl: input_.imageUrl,isMain: input_.isMain
  }!;
}export function jsonCreateRestaurantPhotoRequestToApplicationTransform(
  input_?: any,
): CreateRestaurantPhotoRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    imageUrl: input_.imageUrl,isMain: input_.isMain
  }!;
}export function jsonUpdateRestaurantPhotoRequestToTransportTransform(
  input_?: UpdateRestaurantPhotoRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    imageUrl: input_.imageUrl,isMain: input_.isMain
  }!;
}export function jsonUpdateRestaurantPhotoRequestToApplicationTransform(
  input_?: any,
): UpdateRestaurantPhotoRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    imageUrl: input_.imageUrl,isMain: input_.isMain
  }!;
}export function jsonRestaurantPhotoResponseToTransportTransform(
  input_?: RestaurantPhotoResponse | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonRestaurantPhotoToTransportTransform(input_.data)
  }!;
}export function jsonRestaurantPhotoResponseToApplicationTransform(
  input_?: any,
): RestaurantPhotoResponse {
  if(!input_) {
    return input_ as any;
  }
    return {
    data: jsonRestaurantPhotoToApplicationTransform(input_.data)
  }!;
}export function jsonUpdateReservationStatusRequestToTransportTransform(
  input_?: UpdateReservationStatusRequest | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    status: input_.status
  }!;
}export function jsonUpdateReservationStatusRequestToApplicationTransform(
  input_?: any,
): UpdateReservationStatusRequest {
  if(!input_) {
    return input_ as any;
  }
    return {
    status: input_.status
  }!;
}