import "@typespec/http";
import "./common.tsp";
import "./user.tsp";
import "./restaurant.tsp";

using Http;

namespace RestaurantBookingApi;

model ReservationRestaurantInfo {
  id: string;
  title: string;
  location: Location;
}

model ReservationTableInfo {
  id: string;
  tableNumber: string;
  capacity: int32;
}

model Reservation {
  id: string;
  user: ReservationUserInfo;
  restaurant: ReservationRestaurantInfo;
  table: ReservationTableInfo;
  status: ReservationStatus;
  reservationDate: string;
  reservationTime: string;
  guestsCount: int32;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

model ReservationResponse {
  data: Reservation;
}

model ReservationListResponse {
  data: Reservation[];
  meta: PaginationMeta;
}

model ReservationListQuery {
  status?: ReservationStatus;
  fromDate?: string;
  toDate?: string;
  page?: int32;
  limit?: int32;
}

model CreateReservationRequest {
  restaurantId: string;
  tableId: string;
  reservationDate: string;
  reservationTime: string;
  guestsCount: int32;
  comment?: string;
}

model UpdateReservationRequest {
  tableId?: string;
  reservationDate?: string;
  reservationTime?: string;
  guestsCount?: int32;
  comment?: string;
}

model UpdateReservationStatusRequest {
  status: ReservationStatus;
}

model CancelReservationRequest {
  reason?: string;
}

model CreateReservationResponse {
  @statusCode statusCode: 201;
  data: Reservation;
}
