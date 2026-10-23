export type PriceCategory = "low" | "medium" | "high";
export type ReservationStatus = "confirmed" | "cancelled";

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  created_at: string;
}

export interface Restaurant {
  restaurant_id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  price_category: PriceCategory;
  opening_time: string;
  closing_time: string;
  created_at: string;
}

export interface Cuisine {
  cuisine_id: number;
  name: string;
}

export interface RestaurantCuisine {
  restaurant_id: number;
  cuisine_id: number;
}

export interface RestaurantPhoto {
  id: number;
  restaurant_id: number;
  photo_url: string;
  uploaded_at: string;
}

export interface RestaurantMenu {
  id: number;
  restaurant_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface RestaurantTable {
  table_id: number;
  restaurant_id: number;
  table_number: number;
  capacity: number;
  location_description: string;
  is_active: boolean;
}

export interface Reservation {
  reservation_id: number;
  user_id: number;
  restaurant_id: number;
  table_id: number;
  reservation_datetime: string;
  guest_count: number;
  status: ReservationStatus;
  created_at: string;
}

export interface Review {
  review_id: number;
  user_id: number;
  restaurant_id: number;
  rating: number;
  comment: string;
  created_at: string;
}
