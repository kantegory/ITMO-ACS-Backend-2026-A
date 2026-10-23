import {
  Cuisine,
  Reservation,
  Restaurant,
  RestaurantCuisine,
  RestaurantMenu,
  RestaurantPhoto,
  RestaurantTable,
  Review,
  User
} from "../models/types";

const now = "2026-04-01T12:00:00.000Z";

export const users: User[] = [
  {
    user_id: 1,
    full_name: "Иван Иванов",
    email: "ivan@example.com",
    password_hash: "12345678",
    phone: "+79990000000",
    created_at: now
  }
];

export const restaurants: Restaurant[] = [
  {
    restaurant_id: 1,
    name: "Bella Pasta",
    description: "Итальянская кухня и домашняя паста",
    address: "ул. Ленина, 10",
    city: "Санкт-Петербург",
    price_category: "medium",
    opening_time: "10:00:00",
    closing_time: "23:00:00",
    created_at: now
  },
  {
    restaurant_id: 2,
    name: "Sakura",
    description: "Японская кухня, суши и рамен",
    address: "Невский проспект, 25",
    city: "Санкт-Петербург",
    price_category: "high",
    opening_time: "11:00:00",
    closing_time: "00:00:00",
    created_at: now
  }
];

export const cuisines: Cuisine[] = [
  { cuisine_id: 1, name: "Итальянская" },
  { cuisine_id: 2, name: "Японская" }
];

export const restaurantCuisines: RestaurantCuisine[] = [
  { restaurant_id: 1, cuisine_id: 1 },
  { restaurant_id: 2, cuisine_id: 2 }
];

export const photos: RestaurantPhoto[] = [
  {
    id: 1,
    restaurant_id: 1,
    photo_url: "/uploads/photos/bella-pasta.jpg",
    uploaded_at: now
  }
];

export const menus: RestaurantMenu[] = [
  {
    id: 1,
    restaurant_id: 1,
    file_name: "bella-pasta-menu.pdf",
    file_url: "/uploads/menus/bella-pasta-menu.pdf",
    file_type: "application/pdf",
    uploaded_at: now
  }
];

export const tables: RestaurantTable[] = [
  {
    table_id: 1,
    restaurant_id: 1,
    table_number: 1,
    capacity: 2,
    location_description: "у окна",
    is_active: true
  },
  {
    table_id: 2,
    restaurant_id: 1,
    table_number: 2,
    capacity: 4,
    location_description: "в центре зала",
    is_active: true
  },
  {
    table_id: 3,
    restaurant_id: 2,
    table_number: 1,
    capacity: 4,
    location_description: "у барной стойки",
    is_active: true
  }
];

export const reservations: Reservation[] = [
  {
    reservation_id: 1,
    user_id: 1,
    restaurant_id: 1,
    table_id: 2,
    reservation_datetime: "2026-04-05T19:00:00.000Z",
    guest_count: 4,
    status: "confirmed",
    created_at: now
  }
];

export const reviews: Review[] = [
  {
    review_id: 1,
    user_id: 1,
    restaurant_id: 1,
    rating: 5,
    comment: "Отличная паста и быстрое обслуживание",
    created_at: now
  }
];

export const nextId = <T>(items: T[], field: keyof T): number => {
  const maxId = items.reduce((max, item) => Math.max(max, Number(item[field])), 0);
  return maxId + 1;
};
