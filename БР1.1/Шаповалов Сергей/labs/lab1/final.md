# Что было добавлено и изменено относительно boilerplate

В качестве основы я взял boilerplate для Express + TypeORM, но в проекте `lab1` он превращён из универсального шаблона в готовое REST API для бронирования столиков.

## 1. Из шаблона в предметную задачу

Оригинальный boilerplate обычно содержит:

- базовую настройку Express;
- подключение TypeORM;
- пустые или условные маршруты;
- минимум логики;
- отсутствие доменной модели и бизнес-правил.

В этом проекте всё это доработано под конкретную предметную область — ресторанный сервис.

Что добавлено:

- полноценный сервис с сущностями: `Restaurant`, `User`, `Role`, `Review`, `MenuItem`, `Reservation`, `RestaurantPhoto`, `CuisineType`;
- контроллеры для аутентификации, пользователей, ресторанов, отзывов, бронирований и фото;
- JWT-аутентификация и middleware проверки токена;
- фильтрация и поиск ресторанов по цене, району, кухне и ключевому слову;
- сериализация ответов API под нужный формат;
- OpenAPI/Swagger документация;
- сидеры/заполнение БД тестовыми данными.

## 2. Изменения в структуре проекта

### Основной запуск приложения

Файл `src/app.ts` уже не просто запускает сервер. Здесь:

- подключается CORS;
- включается JSON-парсинг;
- регистрируются все контроллеры через `useExpressServer`;
- подключается Swagger;
- запускается инициализация базы данных через TypeORM.

То есть boilerplate обычно даёт только каркас, а здесь `app.ts` уже настроен под конкретный API.

### Конфигурация БД

Файл `src/config/data-source.ts` настраивает подключение к PostgreSQL и автоматически подгружает сущности:

- `type: 'postgres'`;
- хост, порт, имя пользователя и БД;
- `entities: [SETTINGS.DB_ENTITIES]`;
- `synchronize: true` для разработки.

Это уже не шаблонный пример, а рабочая связка с конкретной СУБД.

### Контроллеры

В папке `src/controllers` появились доменные обработчики запросов:

- `auth.controller.ts` — регистрация и логин;
- `user.controller.ts` — работа с пользователями;
- `restaurant.controller.ts` — список/поиск/создание ресторанов;
- `reservation.controller.ts` — бронирования;
- `review.controller.ts` — отзывы;
- `menu-item.controller.ts` — меню;
- `restaurant-photo.controller.ts` — фото ресторанов;
- `cuisine-type.controller.ts` — типы кухонь.

Это важная разница: boilerplate — это каркас, а здесь уже существует бизнес-логика API.

### Middleware и безопасность

Файл `src/middlewares/auth.middleware.ts` добавляет проверку JWT.
Это важный элемент, которого в boilerplate обычно нет: запросы к защищённым endpoint-ам проходят через авторизацию, а не просто открыты для всех.

## 3. Добавлены модели данных

Сущности в `src/models` описывают таблицы БД через TypeORM:

- `Restaurant` — ресторан;
- `User` — пользователь;
- `Role` — роль;
- `Review` — отзыв;
- `Reservation` — бронирование;
- `MenuItem` — пункт меню;
- `RestaurantPhoto` — фото ресторана;
- `CuisineType` — тип кухни;
- `RestaurantCuisine` — связь ресторан → кухня.

Пример из кода:

```ts
@Entity('restaurants')
export class Restaurant extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255 })
    address: string;

    @Column({ name: 'price_range', type: 'int', nullable: true })
    priceRange: number;

    @OneToMany(() => Review, (review) => review.restaurant)
    reviews: Review[];
}
```

Что здесь происходит:

- `@Entity('restaurants')` — связывает класс с таблицей `restaurants`;
- `@PrimaryGeneratedColumn()` — генерирует первичный ключ;
- `@Column()` — описывает колонки таблицы;
- `@OneToMany()` — задаёт связь один-ко-многим между рестораном и отзывами/фото/меню;
- `priceRange` хранится в колонке `price_range`, а в коде используется как `priceRange` — это удобный маппинг TypeORM.

У `User` такая же логика, но с внешним ключом на `Role`:

```ts
@ManyToOne(() => Role, (role) => role.users, { nullable: true })
@JoinColumn({ name: 'role_id' })
role: Role;
```

Это означает: пользователь относится к роли через поле `role_id`.

## 4. Что такое контроллеры на примере реализованных

Контроллер — это слой, который принимает HTTP-запрос, валидирует входные данные, обращается к репозиторию/БД, выполняет бизнес-логику и возвращает HTTP-ответ.

В проекте контроллеры создаются через `routing-controllers`, а аннотации вроде `@Get`, `@Post`, `@Body`, `@Param` автоматически связывают методы с HTTP-маршрутами.

Пример из `AuthController`:

```ts
@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/login')
    async login(@Body({ type: LoginDto }) loginData: LoginDto) {
        const user = await this.repository.findOne({
            where: { email },
            select: ['id', 'email', 'password'],
        });

        const accessToken = jwt.sign(
            { user: { id: user.id } },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return { accessToken };
    }
}
```

Что здесь происходит:

- `@Post('/login')` — создаёт маршрут `POST /api/auth/login`;
- `@Body({ type: LoginDto })` — берёт данные из тела запроса и валидирует их;
- `this.repository.findOne(...)` — ищет пользователя в БД;
- `checkPassword(...)` — проверяет пароль;
- `jwt.sign(...)` — создаёт токен;
- `return { accessToken }` — формирует ответ клиенту.

То же самое можно сказать про `RestaurantController`: он получает параметры `price_range`, `district`, `cuisine`, `search`, строит запрос к БД, фильтрует данные и возвращает уже сериализованный список ресторанов.

Примерно так работают все контроллеры: запрос → валидация → работа с repository → ответ.

## 5. Что такое `serializers.ts` и зачем он нужен

Файл `src/utils/serializers.ts` содержит функции, которые превращают объект сущности TypeORM в формат, подходящий для API.

Почему это нужно:

- сущности TypeORM содержат имена в стиле `priceRange`, `createdAt`, `restaurantCuisines`;
- клиенту обычно удобнее получать поля в формате `price_range`, `created_at`, `cuisines`, `average_rating`;
- иногда нужно убрать лишние поля, например `password`;
- иногда нужно “расплющить” nested-объекты, чтобы в JSON приходили уже готовые данные.

Пример:

```ts
export function serializeRestaurantList(restaurant: any) {
    return {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        price_range: restaurant.priceRange,
        district: restaurant.district,
        cuisines: getCuisineNames(restaurant),
        average_rating: getAverageRating(restaurant.reviews || []),
    };
}
```

Здесь:

- `priceRange` преобразуется в `price_range`;
- `restaurant.reviews` используется для расчёта среднего рейтинга;
- `restaurantCuisines` преобразуются в `cuisines` — список названий кухонь;
- ответ получается “чистым” и понятным для клиента.

Ещё один пример — `serializeUser`:

```ts
export function serializeUser(user: any) {
    return {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        middle_name: user.middleName,
        email: user.email,
        role: user.roleId,
        role_name: user.role?.name,
        created_at: user.createdAt,
    };
}
```

Здесь мы не возвращаем “сырой” объект пользователя с внутренними полями вроде `password`, а формируем безопасный и нужный клиентский ответ.

## 6. Итог

Итоговое отличие boilerplate от проекта `lab1` такое:

- boilerplate — это каркас приложения;
- `lab1` — это уже готовое, предметно-ориентированное REST API;
- добавлены модели, отношения, JWT, фильтрация, Swagger, бизнес-логика и сериализация;
- контроллеры отвечают за обработку HTTP-запросов;
- модели описывают структуру данных и связи между таблицами;
- `serializers.ts` нужен для приведения данных к правильному API-формату и защиты чувствительных полей.

То есть проект стал не просто “скелетом на Express + TypeORM”, а полноценной системой для ресторана с API, базой данных и авторизацией.
