import {
    Body,
    HttpCode,
    JsonController,
    Param,
    Patch,
    Post,
    UseBefore,
} from 'routing-controllers';
import { Type } from 'class-transformer';
import { OpenAPI } from 'routing-controllers-openapi';
import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsEmail,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Matches,
    Min,
} from 'class-validator';
import { In } from 'typeorm';
import dataSource from '../config/data-source';
import { ApiError } from '../common/api-error';
import { PriceCategory, ReservationStatus, UserRole } from '../common/enums';
import {
    serializeLocation,
    serializeMenuCategory,
    serializeMenuItem,
    serializeReservation,
    serializeRestaurantDetail,
    serializeRestaurantPhoto,
    serializeRestaurantTable,
} from '../common/serializers';
import { PHONE_REGEX, TIME_REGEX } from '../common/validation';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';
import { Cuisine } from '../models/cuisine.entity';
import { Location } from '../models/location.entity';
import { MenuCategory } from '../models/menu-category.entity';
import { MenuItem } from '../models/menu-item.entity';
import { Reservation } from '../models/reservation.entity';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { RestaurantTable } from '../models/restaurant-table.entity';
import { Restaurant } from '../models/restaurant.entity';

class CreateLocationDto {
    @IsString()
    city: string;

    @IsString()
    address: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    metroStation?: string;
}

class UpdateLocationDto {
    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    metroStation?: string;
}

class CreateRestaurantDto {
    @IsString()
    locationId: string;

    @IsEnum(PriceCategory)
    priceCategory: PriceCategory;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    @Matches(PHONE_REGEX)
    phone: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsString()
    @Matches(TIME_REGEX)
    openTime: string;

    @IsString()
    @Matches(TIME_REGEX)
    closeTime: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    cuisineIds?: string[];

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}

class UpdateRestaurantDto {
    @IsOptional()
    @IsString()
    locationId?: string;

    @IsOptional()
    @IsEnum(PriceCategory)
    priceCategory?: PriceCategory;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    @Matches(PHONE_REGEX)
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX)
    openTime?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX)
    closeTime?: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    cuisineIds?: string[];
}

class UpdateRestaurantPublicationDto {
    @IsBoolean()
    isPublished: boolean;
}

class CreateRestaurantTableDto {
    @IsString()
    tableNumber: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    capacity: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

class UpdateRestaurantTableDto {
    @IsOptional()
    @IsString()
    tableNumber?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    capacity?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

class CreateMenuCategoryDto {
    @IsString()
    title: string;
}

class UpdateMenuCategoryDto {
    @IsOptional()
    @IsString()
    title?: string;
}

class CreateMenuItemDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    @Min(0)
    price: number;

    @IsOptional()
    @IsString()
    weight?: string;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;
}

class UpdateMenuItemDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @Type(() => Number)
    @Min(0)
    price?: number;

    @IsOptional()
    @IsString()
    weight?: string;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;
}

class CreateRestaurantPhotoDto {
    @IsString()
    imageUrl: string;

    @IsOptional()
    @IsBoolean()
    isMain?: boolean;
}

class UpdateRestaurantPhotoDto {
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsBoolean()
    isMain?: boolean;
}

class UpdateReservationStatusDto {
    @IsEnum(ReservationStatus)
    status: ReservationStatus;
}

@JsonController('/admin')
@OpenAPI({
    security: [{ bearerAuth: [] }],
})
class AdminController {
    private locationRepository = dataSource.getRepository(Location);
    private restaurantRepository = dataSource.getRepository(Restaurant);
    private cuisineRepository = dataSource.getRepository(Cuisine);
    private tableRepository = dataSource.getRepository(RestaurantTable);
    private menuCategoryRepository = dataSource.getRepository(MenuCategory);
    private menuItemRepository = dataSource.getRepository(MenuItem);
    private photoRepository = dataSource.getRepository(RestaurantPhoto);
    private reservationRepository = dataSource.getRepository(Reservation);

    private restaurantRelations = {
        location: true,
        cuisines: true,
        tables: true,
        photos: true,
        menuCategories: {
            items: true,
        },
        reviews: {
            user: true,
        },
    } as const;

    private async getRestaurantOrFail(restaurantId: string) {
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId },
            relations: this.restaurantRelations,
        });

        if (!restaurant) {
            throw new ApiError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant is not found');
        }

        return restaurant;
    }

    private async getLocationOrFail(locationId: string) {
        const location = await this.locationRepository.findOneBy({ id: locationId });
        if (!location) {
            throw new ApiError(404, 'LOCATION_NOT_FOUND', 'Location is not found');
        }

        return location;
    }

    private async getCuisines(cuisineIds?: string[]) {
        if (!cuisineIds) {
            return undefined;
        }

        const cuisines = await this.cuisineRepository.findBy({
            id: In(cuisineIds),
        });
        if (cuisines.length !== cuisineIds.length) {
            throw new ApiError(404, 'CUISINE_NOT_FOUND', 'One or more cuisines are not found');
        }

        return cuisines;
    }

    private async makePhotoMain(restaurantId: string, photoId?: string) {
        const photos = await this.photoRepository.find({
            where: {
                restaurant: {
                    id: restaurantId,
                },
            },
            relations: {
                restaurant: true,
            },
        });

        for (const photo of photos) {
            photo.isMain = photo.id === photoId;
        }

        await this.photoRepository.save(photos);
    }

    @Post('/locations')
    @HttpCode(201)
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async createLocation(@Body() body: CreateLocationDto) {
        const location = this.locationRepository.create(body);
        const createdLocation = await this.locationRepository.save(location);

        return {
            data: serializeLocation(createdLocation),
        };
    }

    @Patch('/locations/:locationId')
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async updateLocation(
        @Param('locationId') locationId: string,
        @Body() body: UpdateLocationDto,
    ) {
        const location = await this.getLocationOrFail(locationId);
        Object.assign(location, body);
        const updatedLocation = await this.locationRepository.save(location);

        return {
            data: serializeLocation(updatedLocation),
        };
    }

    @Post('/restaurants')
    @HttpCode(201)
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async createRestaurant(@Body() body: CreateRestaurantDto) {
        const location = await this.getLocationOrFail(body.locationId);
        const cuisines = await this.getCuisines(body.cuisineIds);

        const restaurant = this.restaurantRepository.create({
            title: body.title,
            description: body.description,
            phone: body.phone,
            email: body.email,
            openTime: body.openTime,
            closeTime: body.closeTime,
            priceCategory: body.priceCategory,
            isPublished: body.isPublished || false,
            location,
            cuisines: cuisines || [],
        });

        const createdRestaurant = await this.restaurantRepository.save(restaurant);
        const restaurantForResponse = await this.getRestaurantOrFail(createdRestaurant.id);

        return {
            data: serializeRestaurantDetail(restaurantForResponse),
        };
    }

    @Patch('/restaurants/:restaurantId')
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async updateRestaurant(
        @Param('restaurantId') restaurantId: string,
        @Body() body: UpdateRestaurantDto,
    ) {
        const restaurant = await this.getRestaurantOrFail(restaurantId);

        if (body.locationId) {
            restaurant.location = await this.getLocationOrFail(body.locationId);
        }
        if (body.cuisineIds) {
            restaurant.cuisines = (await this.getCuisines(body.cuisineIds)) || [];
        }

        Object.assign(restaurant, {
            title: body.title ?? restaurant.title,
            description:
                body.description !== undefined ? body.description : restaurant.description,
            phone: body.phone ?? restaurant.phone,
            email: body.email !== undefined ? body.email : restaurant.email,
            openTime: body.openTime ?? restaurant.openTime,
            closeTime: body.closeTime ?? restaurant.closeTime,
            priceCategory: body.priceCategory ?? restaurant.priceCategory,
        });

        await this.restaurantRepository.save(restaurant);
        const updatedRestaurant = await this.getRestaurantOrFail(restaurantId);

        return {
            data: serializeRestaurantDetail(updatedRestaurant),
        };
    }

    @Patch('/restaurants/:restaurantId/publication')
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async updateRestaurantPublication(
        @Param('restaurantId') restaurantId: string,
        @Body() body: UpdateRestaurantPublicationDto,
    ) {
        const restaurant = await this.getRestaurantOrFail(restaurantId);
        restaurant.isPublished = body.isPublished;
        await this.restaurantRepository.save(restaurant);

        return {
            data: serializeRestaurantDetail(await this.getRestaurantOrFail(restaurantId)),
        };
    }

    @Post('/restaurants/:restaurantId/tables')
    @HttpCode(201)
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async createTable(
        @Param('restaurantId') restaurantId: string,
        @Body() body: CreateRestaurantTableDto,
    ) {
        const restaurant = await this.getRestaurantOrFail(restaurantId);
        const table = this.tableRepository.create({
            ...body,
            isActive: body.isActive ?? true,
            restaurant,
        });

        const createdTable = await this.tableRepository.save(table);

        return {
            data: serializeRestaurantTable(createdTable),
        };
    }

    @Patch('/tables/:tableId')
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async updateTable(
        @Param('tableId') tableId: string,
        @Body() body: UpdateRestaurantTableDto,
    ) {
        const table = await this.tableRepository.findOne({
            where: { id: tableId },
            relations: { restaurant: true },
        });

        if (!table) {
            throw new ApiError(404, 'TABLE_NOT_FOUND', 'Table is not found');
        }

        Object.assign(table, {
            tableNumber: body.tableNumber ?? table.tableNumber,
            capacity: body.capacity ?? table.capacity,
            isActive: body.isActive ?? table.isActive,
        });

        const updatedTable = await this.tableRepository.save(table);

        return {
            data: serializeRestaurantTable(updatedTable),
        };
    }

    @Post('/restaurants/:restaurantId/menu-categories')
    @HttpCode(201)
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async createMenuCategory(
        @Param('restaurantId') restaurantId: string,
        @Body() body: CreateMenuCategoryDto,
    ) {
        const restaurant = await this.getRestaurantOrFail(restaurantId);
        const category = this.menuCategoryRepository.create({
            title: body.title,
            restaurant,
        });

        const createdCategory = await this.menuCategoryRepository.save(category);
        const categoryForResponse = await this.menuCategoryRepository.findOne({
            where: { id: createdCategory.id },
            relations: { restaurant: true, items: true },
        });

        return {
            data: serializeMenuCategory(categoryForResponse as MenuCategory),
        };
    }

    @Patch('/menu-categories/:menuCategoryId')
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async updateMenuCategory(
        @Param('menuCategoryId') menuCategoryId: string,
        @Body() body: UpdateMenuCategoryDto,
    ) {
        const category = await this.menuCategoryRepository.findOne({
            where: { id: menuCategoryId },
            relations: { restaurant: true, items: true },
        });

        if (!category) {
            throw new ApiError(
                404,
                'MENU_CATEGORY_NOT_FOUND',
                'Menu category is not found',
            );
        }

        if (body.title !== undefined) {
            category.title = body.title;
        }

        const updatedCategory = await this.menuCategoryRepository.save(category);

        return {
            data: serializeMenuCategory(updatedCategory),
        };
    }

    @Post('/menu-categories/:menuCategoryId/items')
    @HttpCode(201)
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async createMenuItem(
        @Param('menuCategoryId') menuCategoryId: string,
        @Body() body: CreateMenuItemDto,
    ) {
        const category = await this.menuCategoryRepository.findOne({
            where: { id: menuCategoryId },
            relations: { restaurant: true },
        });

        if (!category) {
            throw new ApiError(
                404,
                'MENU_CATEGORY_NOT_FOUND',
                'Menu category is not found',
            );
        }

        const item = this.menuItemRepository.create({
            ...body,
            isAvailable: body.isAvailable ?? true,
            menuCategory: category,
        });

        const createdItem = await this.menuItemRepository.save(item);

        return {
            data: serializeMenuItem(createdItem),
        };
    }

    @Patch('/menu-items/:menuItemId')
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async updateMenuItem(
        @Param('menuItemId') menuItemId: string,
        @Body() body: UpdateMenuItemDto,
    ) {
        const item = await this.menuItemRepository.findOne({
            where: { id: menuItemId },
            relations: { menuCategory: true },
        });

        if (!item) {
            throw new ApiError(404, 'MENU_ITEM_NOT_FOUND', 'Menu item is not found');
        }

        Object.assign(item, {
            title: body.title ?? item.title,
            description:
                body.description !== undefined ? body.description : item.description,
            price: body.price ?? item.price,
            weight: body.weight !== undefined ? body.weight : item.weight,
            isAvailable: body.isAvailable ?? item.isAvailable,
        });

        const updatedItem = await this.menuItemRepository.save(item);

        return {
            data: serializeMenuItem(updatedItem),
        };
    }

    @Post('/restaurants/:restaurantId/photos')
    @HttpCode(201)
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async createPhoto(
        @Param('restaurantId') restaurantId: string,
        @Body() body: CreateRestaurantPhotoDto,
    ) {
        const restaurant = await this.getRestaurantOrFail(restaurantId);
        const photo = this.photoRepository.create({
            restaurant,
            imageUrl: body.imageUrl,
            isMain: body.isMain ?? false,
        });

        const createdPhoto = await this.photoRepository.save(photo);
        if (createdPhoto.isMain) {
            await this.makePhotoMain(restaurantId, createdPhoto.id);
        }

        const refreshedPhoto = await this.photoRepository.findOneBy({
            id: createdPhoto.id,
        });

        return {
            data: serializeRestaurantPhoto(refreshedPhoto as RestaurantPhoto),
        };
    }

    @Patch('/photos/:photoId')
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async updatePhoto(
        @Param('photoId') photoId: string,
        @Body() body: UpdateRestaurantPhotoDto,
    ) {
        const photo = await this.photoRepository.findOne({
            where: { id: photoId },
            relations: { restaurant: true },
        });

        if (!photo) {
            throw new ApiError(404, 'PHOTO_NOT_FOUND', 'Photo is not found');
        }

        if (body.imageUrl !== undefined) {
            photo.imageUrl = body.imageUrl;
        }
        if (body.isMain !== undefined) {
            photo.isMain = body.isMain;
        }

        const updatedPhoto = await this.photoRepository.save(photo);
        if (body.isMain === true) {
            await this.makePhotoMain(photo.restaurant.id, photo.id);
        }

        const refreshedPhoto = await this.photoRepository.findOneBy({
            id: updatedPhoto.id,
        });

        return {
            data: serializeRestaurantPhoto(refreshedPhoto as RestaurantPhoto),
        };
    }

    @Patch('/reservations/:reservationId/status')
    @UseBefore(authMiddleware, roleMiddleware(UserRole.ADMIN))
    async updateReservationStatus(
        @Param('reservationId') reservationId: string,
        @Body() body: UpdateReservationStatusDto,
    ) {
        const reservation = await this.reservationRepository.findOne({
            where: { id: reservationId },
            relations: {
                user: true,
                restaurant: {
                    location: true,
                },
                table: true,
            },
        });

        if (!reservation) {
            throw new ApiError(404, 'RESERVATION_NOT_FOUND', 'Reservation is not found');
        }

        reservation.status = body.status;
        const updatedReservation = await this.reservationRepository.save(reservation);

        return {
            data: serializeReservation(updatedReservation),
        };
    }
}

export default AdminController;
