import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../modules/user/user.entity';
import { Company } from '../modules/company/company.entity';
import { Category } from '../modules/category/category.entity';
import { Service } from '../modules/service/service.entity';
import { ServiceCategory } from '../modules/service/service-category.entity';
import { Discount } from '../modules/discount/discount.entity';
import { Request, RequestStatus } from '../modules/request/request.entity';
import { Review } from '../modules/review/review.entity';
import { Favorite } from '../modules/favorite/favorite.entity';
import { hashPassword } from '../utils/hash-password';
import { faker } from '@faker-js/faker';

const SEED_COUNTS = {
  users: 50,
  companies: 20,
  categories: 10,
  servicesPerCompany: 8,
  discountsPerService: 0.3,
  requestsPerUser: 3,
  reviewsPerAcceptedRequest: 0.7,
  favoritesPerUser: 4,
};

async function seed() {
  console.log('🌱 Starting database seeding...');
  
  await AppDataSource.initialize();
  console.log('✅ Database connected');

  // Очищаем таблицы с CASCADE (в правильном порядке)
  console.log('🗑 Cleaning existing data...');
  
  // Используем queryRunner для TRUNCATE с CASCADE
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  
  try {
    // TRUNCATE с CASCADE удалит все зависимые таблицы
    await queryRunner.query(`TRUNCATE TABLE "user_favorites" RESTART IDENTITY CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "reviews" RESTART IDENTITY CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "requests" RESTART IDENTITY CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "discounts" RESTART IDENTITY CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "service_categories" RESTART IDENTITY CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "services" RESTART IDENTITY CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "companies" RESTART IDENTITY CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "categories" RESTART IDENTITY CASCADE`);
    await queryRunner.query(`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`);
    
    console.log('✅ Database cleaned');
  } catch (error) {
    console.error('Error cleaning tables:', error);
  } finally {
    await queryRunner.release();
  }

  // ==================== 1. СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ ====================
  console.log('👤 Creating users...');
  
  const users: User[] = [];
  
  // Админ
  const admin = new User();
  admin.email = 'admin@admin.com';
  admin.password = await hashPassword('admin123');
  admin.first_name = 'Admin';
  admin.last_name = 'System';
  admin.role = UserRole.ADMIN;
  admin.is_verified = true;
  users.push(admin);

  // Владельцы компаний (OWNER)
  for (let i = 0; i < SEED_COUNTS.companies; i++) {
    const user = new User();
    user.email = faker.internet.email().toLowerCase();
    user.password = await hashPassword('password123');
    user.first_name = faker.person.firstName();
    user.last_name = faker.person.lastName();
    user.middle_name = Math.random() > 0.7 ? faker.person.middleName() : null;
    user.role = UserRole.OWNER;
    user.is_verified = true;
    users.push(user);
  }

  // Обычные пользователи (USER)
  for (let i = 0; i < SEED_COUNTS.users; i++) {
    const user = new User();
    user.email = faker.internet.email().toLowerCase();
    user.password = await hashPassword('password123');
    user.first_name = faker.person.firstName();
    user.last_name = faker.person.lastName();
    user.middle_name = Math.random() > 0.7 ? faker.person.middleName() : null;
    user.role = UserRole.USER;
    user.is_verified = Math.random() > 0.2;
    users.push(user);
  }

  const savedUsers = await AppDataSource.getRepository(User).save(users);
  console.log(`✅ Created ${savedUsers.length} users`);

  // Разделяем пользователей по ролям
  const owners = savedUsers.filter(u => u.role === UserRole.OWNER);
  const regularUsers = savedUsers.filter(u => u.role === UserRole.USER);
  console.log(`   - Owners: ${owners.length}, Regular users: ${regularUsers.length}, Admin: 1`);

  // ==================== 2. СОЗДАНИЕ КАТЕГОРИЙ ====================
  console.log('📂 Creating categories...');
  
  const categoryNames = [
    'Физическая охрана', 'Пультовая охрана', 'Монтаж CCTV', 'Охрана мероприятий',
    'Сопровождение грузов', 'Корпоративная безопасность', 'Техническая защита',
    'Кибербезопасность', 'Пожарная безопасность', 'Детективное агентство'
  ];
  
  const categories: Category[] = [];
  for (let i = 0; i < Math.min(SEED_COUNTS.categories, categoryNames.length); i++) {
    const category = new Category();
    category.title = categoryNames[i];
    category.is_published = Math.random() > 0.1;
    categories.push(category);
  }
  
  const savedCategories = await AppDataSource.getRepository(Category).save(categories);
  console.log(`✅ Created ${savedCategories.length} categories`);

  // ==================== 3. СОЗДАНИЕ КОМПАНИЙ ====================
  console.log('🏢 Creating companies...');
  
  const companyTitles = [
    'Щит и Меч', 'Безопасный Город', 'Гвардия', 'Альфа-Охрана', 'Страж',
    'Легион', 'Форт', 'Бастион', 'Авангард', 'Рубеж'
  ];
  
  const companies: Company[] = [];
  for (let i = 0; i < owners.length; i++) {
    const company = new Company();
    company.user_id = owners[i].id;
    company.title = companyTitles[i % companyTitles.length] + (Math.floor(i / companyTitles.length) + 1);
    company.description = faker.lorem.paragraphs(Math.floor(Math.random() * 3) + 1);
    company.logo_url = Math.random() > 0.3 ? faker.image.url() : null;
    company.website = Math.random() > 0.5 ? `https://${faker.internet.domainName()}` : null;
    companies.push(company);
  }
  
  const savedCompanies = await AppDataSource.getRepository(Company).save(companies);
  console.log(`✅ Created ${savedCompanies.length} companies`);

  // ==================== 4. СОЗДАНИЕ УСЛУГ ====================
  console.log('🔧 Creating services...');
  
  const serviceNames = [
    'Пультовая охрана', 'Группа быстрого реагирования', 'Установка видеонаблюдения',
    'Охрана мероприятий', 'Сопровождение грузов', 'Физическая охрана объекта',
    'Контроль пропускного режима', 'Патрулирование территории', 'Мониторинг безопасности',
    'Аудит безопасности', 'Расследование инцидентов', 'Установка сигнализации'
  ];
  
  const allServices: Service[] = [];

  for (const company of savedCompanies) {
    const numServices = Math.floor(Math.random() * SEED_COUNTS.servicesPerCompany) + 3;
    
    for (let i = 0; i < numServices; i++) {
      const service = new Service();
      service.company_id = company.id;
      service.name = serviceNames[Math.floor(Math.random() * serviceNames.length)] + 
                     (Math.random() > 0.5 ? ` ${faker.word.adjective()}` : '');
      service.description = Math.random() > 0.3 ? faker.lorem.sentence() : null;
      service.base_price = Math.floor(Math.random() * 50000 + 5000) / 100;
      service.is_published = Math.random() > 0.1;
      allServices.push(service);
    }
  }
  
  const savedServices = await AppDataSource.getRepository(Service).save(allServices);
  console.log(`✅ Created ${savedServices.length} services`);

  // ==================== 5. СВЯЗИ УСЛУГ С КАТЕГОРИЯМИ ====================
  console.log('🔗 Creating service-category relations...');
  
  const allServiceCategories: ServiceCategory[] = [];
  
  for (const service of savedServices) {
    const numCategories = Math.floor(Math.random() * 3) + 1;
    const shuffledCategories = [...savedCategories].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(numCategories, shuffledCategories.length); i++) {
      const sc = new ServiceCategory();
      sc.service_id = service.id;
      sc.category_id = shuffledCategories[i].id;
      allServiceCategories.push(sc);
    }
  }
  
  // Удаляем дубликаты
  const uniqueSCs = allServiceCategories.filter((sc, index, self) =>
    index === self.findIndex(s => s.service_id === sc.service_id && s.category_id === sc.category_id)
  );
  
  if (uniqueSCs.length > 0) {
    await AppDataSource.getRepository(ServiceCategory).save(uniqueSCs);
  }
  console.log(`✅ Created ${uniqueSCs.length} service-category relations`);

  // ==================== 6. СКИДКИ ====================
  console.log('💰 Creating discounts...');
  
  const allDiscounts: Discount[] = [];
  
  for (const service of savedServices) {
    if (Math.random() < SEED_COUNTS.discountsPerService) {
      const discount = new Discount();
      discount.service_id = service.id;
      discount.percentage = Math.floor(Math.random() * 30) + 5;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
      discount.start_at = startDate;
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 60) + 1);
      discount.end_at = endDate;
      
      allDiscounts.push(discount);
    }
  }
  
  if (allDiscounts.length > 0) {
    await AppDataSource.getRepository(Discount).save(allDiscounts);
  }
  console.log(`✅ Created ${allDiscounts.length} discounts`);

  // ==================== 7. ЗАЯВКИ ====================
  console.log('📝 Creating requests...');
  
  const allRequests: Request[] = [];
  
  for (const user of regularUsers) {
    const numRequests = Math.floor(Math.random() * SEED_COUNTS.requestsPerUser) + 1;
    const shuffledServices = [...savedServices].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(numRequests, shuffledServices.length); i++) {
      const service = shuffledServices[i];
      const company = savedCompanies.find(c => c.id === service.company_id);
      
      // Пропускаем если пользователь владелец компании
      if (company && company.user_id === user.id) continue;
      
      const request = new Request();
      request.service_id = service.id;
      request.user_id = user.id;
      
      const rand = Math.random();
      if (rand < 0.4) request.status = RequestStatus.PENDING;
      else if (rand < 0.7) request.status = RequestStatus.ACCEPTED;
      else if (rand < 0.9) request.status = RequestStatus.REJECTED;
      else request.status = RequestStatus.CANCELLED;
      
      request.description = Math.random() > 0.5 ? faker.lorem.sentence() : null;
      request.reply = request.status !== RequestStatus.PENDING && Math.random() > 0.5 
        ? faker.lorem.sentence() : null;
      
      allRequests.push(request);
    }
  }
  
  const savedRequests = await AppDataSource.getRepository(Request).save(allRequests);
  console.log(`✅ Created ${savedRequests.length} requests`);

  // ==================== 8. ОТЗЫВЫ ====================
  console.log('⭐ Creating reviews...');
  
  const allReviews: Review[] = [];
  const acceptedRequests = savedRequests.filter(r => r.status === RequestStatus.ACCEPTED);
  
  for (const request of acceptedRequests) {
    if (Math.random() < SEED_COUNTS.reviewsPerAcceptedRequest) {
      const review = new Review();
      review.service_id = request.service_id;
      review.user_id = request.user_id;
      review.rating = Math.floor(Math.random() * 5) + 1;
      review.comment = Math.random() > 0.2 ? faker.lorem.paragraph() : null;
      allReviews.push(review);
    }
  }
  
  // Удаляем дубликаты
  const uniqueReviews = allReviews.filter((review, index, self) =>
    index === self.findIndex(r => r.service_id === review.service_id && r.user_id === review.user_id)
  );
  
  if (uniqueReviews.length > 0) {
    await AppDataSource.getRepository(Review).save(uniqueReviews);
  }
  console.log(`✅ Created ${uniqueReviews.length} reviews`);

  // ==================== 9. ИЗБРАННОЕ ====================
  console.log('❤️ Creating favorites...');
  
  const allFavorites: Favorite[] = [];
  
  for (const user of regularUsers) {
    const numFavorites = Math.floor(Math.random() * SEED_COUNTS.favoritesPerUser) + 1;
    const shuffledForFav = [...savedServices].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(numFavorites, shuffledForFav.length); i++) {
      const favorite = new Favorite();
      favorite.user_id = user.id;
      favorite.service_id = shuffledForFav[i].id;
      allFavorites.push(favorite);
    }
  }
  
  // Удаляем дубликаты
  const uniqueFavorites = allFavorites.filter((fav, index, self) =>
    index === self.findIndex(f => f.service_id === fav.service_id && f.user_id === fav.user_id)
  );
  
  if (uniqueFavorites.length > 0) {
    await AppDataSource.getRepository(Favorite).save(uniqueFavorites);
  }
  console.log(`✅ Created ${uniqueFavorites.length} favorites`);

  // ==================== ИТОГИ ====================
  console.log('\n🎉 Seeding completed!');
  console.log('📊 Summary:');
  console.log(`   - Users: ${savedUsers.length}`);
  console.log(`   - Companies: ${savedCompanies.length}`);
  console.log(`   - Categories: ${savedCategories.length}`);
  console.log(`   - Services: ${savedServices.length}`);
  console.log(`   - Service-Category relations: ${uniqueSCs.length}`);
  console.log(`   - Discounts: ${allDiscounts.length}`);
  console.log(`   - Requests: ${savedRequests.length}`);
  console.log(`   - Reviews: ${uniqueReviews.length}`);
  console.log(`   - Favorites: ${uniqueFavorites.length}`);
  
  await AppDataSource.destroy();
  console.log('\n✅ Database connection closed');
}

seed().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});