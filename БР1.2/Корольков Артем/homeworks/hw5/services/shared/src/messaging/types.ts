export type RestaurantSnapshot = {
  id: number;
  name: string;
  city: string;
  cuisine: string;
  average_check: number;
};

export type ReservationRequestMessage = {
  type: 'reservation.request';
  correlationId: string;
  userId: number;
  restaurantId: number;
  guests_count: unknown;
  reservation_datetime: unknown;
};

export type ReservationValidatedMessage = {
  type: 'reservation.validated';
  correlationId: string;
  userId: number;
  restaurant: RestaurantSnapshot;
  guests_count: unknown;
  reservation_datetime: unknown;
};

export type ReservationFailedMessage = {
  type: 'reservation.failed';
  correlationId: string;
  error: string;
};

export type ReservationCompletedMessage = {
  type: 'reservation.completed';
  reservationId: number;
  userId: number;
  restaurantId: number;
  restaurant_name: string;
  guests_count: unknown;
  reservation_datetime: unknown;
};
