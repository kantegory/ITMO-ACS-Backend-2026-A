import { z } from 'zod';

export interface FavoriteResponse {
  service_id: number;
  name: string;
  company: {
    id: number;
    title: string;
  };
  price: number;
  final_price: number;
  avg_rating: number | null;
  added_at: Date;
}