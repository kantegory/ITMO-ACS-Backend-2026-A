import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Cuisine } from '../entities/Cuisine';
import { serializeCuisine } from '../utils/serializers';

export const list = async (_req: Request, res: Response) => {
  const items = await AppDataSource.getRepository(Cuisine).find({
    order: { name: 'ASC' },
  });
  res.json(items.map(serializeCuisine));
};
