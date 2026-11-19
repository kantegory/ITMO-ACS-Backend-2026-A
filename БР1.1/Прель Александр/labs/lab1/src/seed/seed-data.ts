import bcrypt from "bcryptjs";
import { DataSource } from "typeorm";
import {
  Cuisine,
  MenuCategory,
  MenuItem,
  Reservation,
  Restaurant,
  RestaurantPhoto,
  RestaurantTable,
  Review,
  User,
} from "../entities";

export const seedDatabase = async (dataSource: DataSource) => {
  const restaurantRepository = dataSource.getRepository(Restaurant);
  const existingRestaurants = await restaurantRepository.count();

  if (existingRestaurants > 0) {
    return;
  }

  const cuisineRepository = dataSource.getRepository(Cuisine);
  const tableRepository = dataSource.getRepository(RestaurantTable);
  const menuCategoryRepository = dataSource.getRepository(MenuCategory);
  const menuItemRepository = dataSource.getRepository(MenuItem);
  const photoRepository = dataSource.getRepository(RestaurantPhoto);
  const userRepository = dataSource.getRepository(User);
  const reviewRepository = dataSource.getRepository(Review);
  const reservationRepository = dataSource.getRepository(Reservation);

  const [italian, japanese, georgian, european] = await cuisineRepository.save([
    cuisineRepository.create({ name: "Итальянская" }),
    cuisineRepository.create({ name: "Японская" }),
    cuisineRepository.create({ name: "Грузинская" }),
    cuisineRepository.create({ name: "Европейская" }),
  ]);

  const [laPiazza, sushiPoint, khinkaliHouse] = await restaurantRepository.save([
    restaurantRepository.create({
      name: "La Piazza",
      description: "Итальянский ресторан с домашней пастой, пиццей и семейной атмосферой.",
      address: "ул. Тверская, 10",
      city: "Москва",
      priceCategory: "medium",
      phone: "+74951234567",
      openingTime: "10:00:00",
      closingTime: "23:00:00",
      cuisines: [italian, european],
    }),
    restaurantRepository.create({
      name: "Sushi Point",
      description: "Небольшой японский ресторан с суши, роллами и быстрым сервисом.",
      address: "Невский проспект, 24",
      city: "Санкт-Петербург",
      priceCategory: "budget",
      phone: "+78121234567",
      openingTime: "11:00:00",
      closingTime: "22:00:00",
      cuisines: [japanese],
    }),
    restaurantRepository.create({
      name: "Khinkali House",
      description: "Премиальный грузинский ресторан с открытой кухней и винной картой.",
      address: "ул. Арбат, 5",
      city: "Москва",
      priceCategory: "premium",
      phone: "+74957654321",
      openingTime: "12:00:00",
      closingTime: "00:00:00",
      cuisines: [georgian, european],
    }),
  ]);

  const tables = await tableRepository.save([
    tableRepository.create({ restaurant: laPiazza, tableNumber: "1", capacity: 2, isActive: true }),
    tableRepository.create({ restaurant: laPiazza, tableNumber: "2", capacity: 4, isActive: true }),
    tableRepository.create({ restaurant: laPiazza, tableNumber: "3", capacity: 6, isActive: true }),
    tableRepository.create({ restaurant: sushiPoint, tableNumber: "1", capacity: 2, isActive: true }),
    tableRepository.create({ restaurant: sushiPoint, tableNumber: "2", capacity: 4, isActive: true }),
    tableRepository.create({ restaurant: khinkaliHouse, tableNumber: "VIP-1", capacity: 6, isActive: true }),
    tableRepository.create({ restaurant: khinkaliHouse, tableNumber: "VIP-2", capacity: 8, isActive: true }),
  ]);

  const [pasta, pizza, rolls, sushi, hotDishes] = await menuCategoryRepository.save([
    menuCategoryRepository.create({ restaurant: laPiazza, name: "Паста" }),
    menuCategoryRepository.create({ restaurant: laPiazza, name: "Пицца" }),
    menuCategoryRepository.create({ restaurant: sushiPoint, name: "Роллы" }),
    menuCategoryRepository.create({ restaurant: sushiPoint, name: "Суши" }),
    menuCategoryRepository.create({ restaurant: khinkaliHouse, name: "Горячие блюда" }),
  ]);

  await menuItemRepository.save([
    menuItemRepository.create({ category: pasta, name: "Карбонара", description: "Паста с беконом, сыром и сливочным соусом.", price: 690, isAvailable: true }),
    menuItemRepository.create({ category: pasta, name: "Болоньезе", description: "Паста с мясным соусом.", price: 710, isAvailable: true }),
    menuItemRepository.create({ category: pizza, name: "Маргарита", description: "Классическая пицца с томатами и моцареллой.", price: 650, isAvailable: true }),
    menuItemRepository.create({ category: rolls, name: "Филадельфия", description: "Ролл с лососем и сливочным сыром.", price: 520, isAvailable: true }),
    menuItemRepository.create({ category: sushi, name: "Суши с тунцом", description: "Рис, тунец и соевый соус.", price: 240, isAvailable: true }),
    menuItemRepository.create({ category: hotDishes, name: "Хинкали", description: "Классические хинкали с говядиной.", price: 540, isAvailable: true }),
  ]);

  await photoRepository.save([
    photoRepository.create({ restaurant: laPiazza, photoUrl: "https://cdn.example.com/restaurants/la-piazza/main.jpg" }),
    photoRepository.create({ restaurant: laPiazza, photoUrl: "https://cdn.example.com/restaurants/la-piazza/interior.jpg" }),
    photoRepository.create({ restaurant: sushiPoint, photoUrl: "https://cdn.example.com/restaurants/sushi-point/main.jpg" }),
    photoRepository.create({ restaurant: khinkaliHouse, photoUrl: "https://cdn.example.com/restaurants/khinkali-house/main.jpg" }),
  ]);

  const [demoUser, secondUser] = await userRepository.save([
    userRepository.create({
      firstName: "Гена",
      lastName: "Роналду",
      email: "gena.ronaldu@example.com",
      phone: "+79991234567",
      passwordHash: await bcrypt.hash("StrongPass123", 10),
    }),
    userRepository.create({
      firstName: "Анна",
      lastName: "Иванова",
      email: "anna.ivanova@example.com",
      phone: "+79990001122",
      passwordHash: await bcrypt.hash("StrongPass123", 10),
    }),
  ]);

  await reviewRepository.save([
    reviewRepository.create({ user: demoUser, restaurant: laPiazza, rating: 5, comment: "Отличная паста и уютная атмосфера." }),
    reviewRepository.create({ user: secondUser, restaurant: laPiazza, rating: 4, comment: "Хорошее обслуживание, но вечером шумно." }),
    reviewRepository.create({ user: demoUser, restaurant: sushiPoint, rating: 4, comment: "Быстро и недорого." }),
    reviewRepository.create({ user: secondUser, restaurant: khinkaliHouse, rating: 5, comment: "Вкусные хинкали и отличный интерьер." }),
  ]);

  await reservationRepository.save(
    reservationRepository.create({
      user: demoUser,
      table: tables[1],
      reservationDate: "2026-05-15",
      startTime: "19:00:00",
      endTime: "21:00:00",
      guestsCount: 4,
      status: "confirmed",
    }),
  );
};
