export type PriceCategory = "low" | "medium" | "high";
export type ReservationStatus = "confirmed" | "cancelled";

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
}

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  price_category: PriceCategory;
  cuisines: string[];
}

export interface RestaurantTable {
  id: number;
  restaurant_id: number;
  table_number: number;
  capacity: number;
  location_description: string;
  is_active: boolean;
}

export interface Reservation {
  id: number;
  user_id: number;
  restaurant_id: number;
  table_id: number;
  reservation_datetime: string;
  guest_count: number;
  status: ReservationStatus;
}
