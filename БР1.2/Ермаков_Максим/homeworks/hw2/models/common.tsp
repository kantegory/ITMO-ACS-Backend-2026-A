namespace RestaurantBookingApi;

enum UserRole {
  ADMIN: "ADMIN",
  USER: "USER",
}

enum PriceCategory {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
}

enum ReservationStatus {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
}

model PaginationMeta {
  page: int32;
  limit: int32;
  totalItems: int32;
  totalPages: int32;
}

model PaginationQuery {
  page?: int32;
  limit?: int32;
}

model ActionSuccessResponse {
  message: string;
}

model RoleItem {
  code: UserRole;
  label: string;
}

model UserRoleListResponse {
  data: RoleItem[];
}

model PriceCategoryItem {
  code: PriceCategory;
  label: string;
}

model PriceCategoryListResponse {
  data: PriceCategoryItem[];
}

model ReservationStatusItem {
  code: ReservationStatus;
  label: string;
}

model ReservationStatusListResponse {
  data: ReservationStatusItem[];
}
