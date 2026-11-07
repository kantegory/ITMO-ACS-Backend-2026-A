import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Property } from "../entities/Property";
import { PropertyType } from "../entities/PropertyType";
import { Location } from "../entities/Location";
import { Amenity } from "../entities/Amenity";
import { User } from "../entities/User";
import { PropertyPhoto } from "../entities/PropertyPhoto";
import { parsePagination, buildPageResponse } from "../utils/pagination";
import { toProperty, toPropertyDetail, toPhoto } from "../utils/mappers";
import { badRequest, forbidden, notFound } from "../utils/errors";

const propsRepo = () => AppDataSource.getRepository(Property);
const typesRepo = () => AppDataSource.getRepository(PropertyType);
const amenityRepo = () => AppDataSource.getRepository(Amenity);
const photosRepo = () => AppDataSource.getRepository(PropertyPhoto);

const parseAmenityIds = (raw: unknown): number[] => {
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((v) => parseInt(String(v), 10)).filter((n) => !Number.isNaN(n));
};

const loadAmenities = async (ids: number[]) => {
  if (!ids.length) return [];
  const found = await amenityRepo().find({ where: { id: In(ids) } });
  if (found.length !== ids.length) throw badRequest("Некоторые удобства не найдены", "invalid_amenities");
  return found;
};

export const searchProperties = async (req: Request, res: Response) => {
  const { page, size, skip } = parsePagination(req.query);
  const {
    property_type_id,
    city,
    district,
    price_min,
    price_max,
    rooms_min,
    rooms_max,
    sort_by,
  } = req.query as Record<string, string>;

  const amenityIds = parseAmenityIds(req.query.amenity_ids);

  const qb = propsRepo()
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.propertyType", "ptype")
    .leftJoinAndSelect("p.location", "location")
    .leftJoinAndSelect("p.amenities", "amenities");

  if (property_type_id) qb.andWhere("ptype.id = :tid", { tid: parseInt(property_type_id, 10) });
  if (city) qb.andWhere("location.city ILIKE :city", { city });
  if (district) qb.andWhere("location.district ILIKE :district", { district });
  if (price_min) qb.andWhere("p.pricePerMonth >= :pmin", { pmin: parseFloat(price_min) });
  if (price_max) qb.andWhere("p.pricePerMonth <= :pmax", { pmax: parseFloat(price_max) });
  if (rooms_min) qb.andWhere("p.rooms >= :rmin", { rmin: parseInt(rooms_min, 10) });
  if (rooms_max) qb.andWhere("p.rooms <= :rmax", { rmax: parseInt(rooms_max, 10) });

  if (amenityIds.length) {
    qb.andWhere(
      `p.id IN (
        SELECT pa.property_id FROM property_amenities pa
        WHERE pa.amenity_id IN (:...aids)
        GROUP BY pa.property_id
        HAVING COUNT(DISTINCT pa.amenity_id) = :acount
      )`,
      { aids: amenityIds, acount: amenityIds.length }
    );
  }

  switch (sort_by) {
    case "price_asc":
      qb.orderBy("p.pricePerMonth", "ASC");
      break;
    case "price_desc":
      qb.orderBy("p.pricePerMonth", "DESC");
      break;
    default:
      qb.orderBy("p.createdAt", "DESC");
  }

  qb.skip(skip).take(size);

  const [rows, total] = await qb.getManyAndCount();
  res.json(buildPageResponse(rows.map(toProperty), total, page, size));
};

export const getProperty = async (req: Request, res: Response) => {
  const p = await propsRepo().findOne({
    where: { id: req.params.id },
    relations: ["propertyType", "location", "amenities", "photos", "owner"],
  });
  if (!p) throw notFound("Объект не найден");
  res.json(toPropertyDetail(p));
};

export const createProperty = async (req: Request, res: Response) => {
  if (req.user!.role !== "landlord") throw forbidden("Только арендодатель может создавать объекты");
  const body = req.body ?? {};
  const {
    title,
    description,
    property_type_id,
    price_per_month,
    area_sqm,
    rooms,
    rental_conditions,
    location,
    amenity_ids,
  } = body;

  if (!title || !description || !property_type_id || price_per_month == null || !location) {
    throw badRequest("title, description, property_type_id, price_per_month, location обязательны");
  }
  const type = await typesRepo().findOne({ where: { id: property_type_id } });
  if (!type) throw badRequest("Тип недвижимости не найден", "invalid_property_type");
  if (!location.city || !location.address) throw badRequest("location.city и location.address обязательны");

  const amenities = await loadAmenities(parseAmenityIds(amenity_ids));

  const loc = AppDataSource.getRepository(Location).create({
    city: location.city,
    district: location.district,
    address: location.address,
  });

  const owner = await AppDataSource.getRepository(User).findOne({ where: { id: req.user!.sub } });
  const p = propsRepo().create({
    title,
    description,
    pricePerMonth: String(price_per_month),
    areaSqm: area_sqm != null ? String(area_sqm) : undefined,
    rooms: rooms ?? undefined,
    rentalConditions: rental_conditions ?? undefined,
    propertyType: type,
    location: loc,
    amenities,
    owner: owner!,
  });
  await propsRepo().save(p);
  const full = await propsRepo().findOne({
    where: { id: p.id },
    relations: ["propertyType", "location", "amenities", "photos", "owner"],
  });
  res.status(201).json(toPropertyDetail(full!));
};

export const updateProperty = async (req: Request, res: Response) => {
  const p = await propsRepo().findOne({
    where: { id: req.params.id },
    relations: ["propertyType", "location", "amenities", "photos", "owner"],
  });
  if (!p) throw notFound("Объект не найден");
  if (String(p.owner.id) !== req.user!.sub) throw forbidden("Нет прав на редактирование этого объекта");

  const b = req.body ?? {};
  if (b.title !== undefined) p.title = b.title;
  if (b.description !== undefined) p.description = b.description;
  if (b.price_per_month !== undefined) p.pricePerMonth = String(b.price_per_month);
  if (b.area_sqm !== undefined) p.areaSqm = b.area_sqm != null ? String(b.area_sqm) : (null as any);
  if (b.rooms !== undefined) p.rooms = b.rooms;
  if (b.rental_conditions !== undefined) p.rentalConditions = b.rental_conditions;
  if (b.is_available !== undefined) p.isAvailable = !!b.is_available;

  if (b.property_type_id !== undefined) {
    const type = await typesRepo().findOne({ where: { id: b.property_type_id } });
    if (!type) throw badRequest("Тип недвижимости не найден", "invalid_property_type");
    p.propertyType = type;
  }

  if (b.location !== undefined) {
    if (!b.location.city || !b.location.address) {
      throw badRequest("location.city и location.address обязательны");
    }
    p.location.city = b.location.city;
    p.location.district = b.location.district ?? (null as any);
    p.location.address = b.location.address;
  }

  if (b.amenity_ids !== undefined) {
    p.amenities = await loadAmenities(parseAmenityIds(b.amenity_ids));
  }

  await propsRepo().save(p);
  const full = await propsRepo().findOne({
    where: { id: p.id },
    relations: ["propertyType", "location", "amenities", "photos", "owner"],
  });
  res.json(toPropertyDetail(full!));
};

export const deleteProperty = async (req: Request, res: Response) => {
  const p = await propsRepo().findOne({
    where: { id: req.params.id },
    relations: ["owner"],
  });
  if (!p) throw notFound("Объект не найден");
  if (String(p.owner.id) !== req.user!.sub) throw forbidden("Нет прав на удаление этого объекта");
  await propsRepo().remove(p);
  res.status(204).send();
};

export const addPhoto = async (req: Request, res: Response) => {
  const p = await propsRepo().findOne({
    where: { id: req.params.id },
    relations: ["owner"],
  });
  if (!p) throw notFound("Объект не найден");
  if (String(p.owner.id) !== req.user!.sub) throw forbidden("Нет прав на редактирование");
  const { url, sort_order } = req.body ?? {};
  if (!url) throw badRequest("url обязателен (загрузка multipart не реализована; передайте ссылку)");
  const photo = photosRepo().create({ property: p, url, sortOrder: sort_order ?? 0 });
  await photosRepo().save(photo);
  res.status(201).json(toPhoto(photo));
};

export const deletePhoto = async (req: Request, res: Response) => {
  const p = await propsRepo().findOne({ where: { id: req.params.id }, relations: ["owner"] });
  if (!p) throw notFound("Объект не найден");
  if (String(p.owner.id) !== req.user!.sub) throw forbidden("Нет прав на удаление");
  const photo = await photosRepo().findOne({
    where: { id: req.params.photoId, property: { id: req.params.id } },
  });
  if (!photo) throw notFound("Фото не найдено");
  await photosRepo().remove(photo);
  res.status(204).send();
};
