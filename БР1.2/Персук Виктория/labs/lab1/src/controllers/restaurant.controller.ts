import {
    Body,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import { Request } from 'express';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Restaurant } from '../models/restaurant.entity';
import { RestaurantOwner } from '../models/restaurant-owner.entity';
import { RestaurantStaff } from '../models/restaurant-staff.entity';
import { RestaurantCuisine } from '../models/restaurant-cuisine.entity';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { Menu } from '../models/menu.entity';
import { MenuItem } from '../models/menu-item.entity';
import { Review } from '../models/review.entity';
import { Reservation } from '../models/reservation.entity';
import { Table } from '../models/table.entity';
import { Role } from '../models/role.entity';
import { User } from '../models/user.entity';
import { RestaurantStatus, RoleName, PriceCategory } from '../common/enums';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { CreateRestaurantDto, UpdateRestaurantDto, AddStaffDto, CreateMenuDto, CreatePhotoDto } from '../dto/restaurant.dto';
import { CreateMenuItemDto, UpdateMenuItemDto } from '../dto/menu-item.dto';
import { CreateTableDto, UpdateTableDto } from '../dto/table.dto';
import { CreateReservationDto, UpdateReservationDto } from '../dto/reservation.dto';
import { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto';

async function getCallerRole(userId: number): Promise<RoleName | null> {
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOne({
        where: { user_id: userId },
        relations: ['role'],
    });
    return user?.role?.name || null;
}

@EntityController({
    baseRoute: '/restaurants',
    entity: Restaurant,
})
class RestaurantController extends BaseController {

    @Get('')
    @OpenAPI({ summary: 'Get all verified restaurants with optional filters' })
    async getAll(@Req() req: Request) {
        const { city, cuisine_id, price } = req.query as Record<string, string>;
        const cuisineId = cuisine_id ? parseInt(cuisine_id) : undefined;

        const qb = this.repository
            .createQueryBuilder('restaurant')
            .where('restaurant.status = :status', { status: RestaurantStatus.Verified });

        if (city) {
            qb.andWhere('restaurant.city = :city', { city });
        }
        if (price) {
            qb.andWhere('restaurant.price = :price', { price });
        }
        if (cuisineId) {
            qb.innerJoin(
                'restaurant_cuisines',
                'rc',
                'rc.restaurant_id = restaurant.restaurant_id AND rc.cuisine_id = :cuisineId',
                { cuisineId },
            );
        }

        return await qb.getMany();
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create a new restaurant', security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateRestaurantDto }) body: CreateRestaurantDto,
    ) {
        const { user } = request;

        const newRestaurant = this.repository.create({
            ...body,
            status: RestaurantStatus.Pending,
        });
        const savedRestaurant = await this.repository.save(newRestaurant) as Restaurant;

        const roleRepo = dataSource.getRepository(Role);
        let ownerRole = await roleRepo.findOneBy({ name: RoleName.Owner });
        if (!ownerRole) {
            ownerRole = roleRepo.create({ name: RoleName.Owner });
            await roleRepo.save(ownerRole);
        }

        const userRepo = dataSource.getRepository(User);
        await userRepo.update({ user_id: user.id }, { role_id: ownerRole.role_id });

        const ownerRepo = dataSource.getRepository(RestaurantOwner);
        const ownerRecord = ownerRepo.create({
            user_id: user.id,
            restaurant_id: savedRestaurant.restaurant_id,
        });
        await ownerRepo.save(ownerRecord);

        return savedRestaurant;
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Get restaurant by id' })
    async getById(@Param('id') id: number) {
        return await this.repository.findOneBy({ restaurant_id: id });
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update restaurant', security: [{ bearerAuth: [] }] })
    async update(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
        @Body({ type: UpdateRestaurantDto }) body: UpdateRestaurantDto,
    ) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        const restaurant = await this.repository.findOneBy({ restaurant_id: id }) as Restaurant;
        if (!restaurant) {
            return { message: 'Restaurant not found' };
        }

        if (role !== RoleName.Admin) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!isOwner) {
                return { message: 'Forbidden: not the owner' };
            }
        }

        Object.assign(restaurant, body);
        return await this.repository.save(restaurant);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete restaurant', security: [{ bearerAuth: [] }] })
    async delete(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        const restaurant = await this.repository.findOneBy({ restaurant_id: id });
        if (!restaurant) {
            return { message: 'Restaurant not found' };
        }

        if (role !== RoleName.Admin) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!isOwner) {
                return { message: 'Forbidden: not the owner' };
            }
        }

        await this.repository.delete({ restaurant_id: id });
        return { message: 'Restaurant deleted' };
    }

    @Patch('/:id/verify')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Verify a restaurant (Admin only)', security: [{ bearerAuth: [] }] })
    async verify(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        const { user } = request;
        const role = await getCallerRole(user.id);
        if (role !== RoleName.Admin) {
            return { message: 'Forbidden: admin only' };
        }

        const restaurant = await this.repository.findOneBy({ restaurant_id: id }) as Restaurant;
        if (!restaurant) {
            return { message: 'Restaurant not found' };
        }

        restaurant.status = RestaurantStatus.Verified;
        return await this.repository.save(restaurant);
    }

    @Patch('/:id/reject')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Reject a restaurant (Admin only)', security: [{ bearerAuth: [] }] })
    async reject(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        const { user } = request;
        const role = await getCallerRole(user.id);
        if (role !== RoleName.Admin) {
            return { message: 'Forbidden: admin only' };
        }

        const restaurant = await this.repository.findOneBy({ restaurant_id: id }) as Restaurant;
        if (!restaurant) {
            return { message: 'Restaurant not found' };
        }

        restaurant.status = RestaurantStatus.Rejected;
        return await this.repository.save(restaurant);
    }

    // ---- Staff ----

    @Get('/:id/staff')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get staff for a restaurant', security: [{ bearerAuth: [] }] })
    async getStaff(@Param('id') id: number) {
        const staffRepo = dataSource.getRepository(RestaurantStaff);
        return await staffRepo.find({
            where: { restaurant_id: id },
            relations: ['user'],
        });
    }

    @Post('/:id/staff')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Add staff to a restaurant', security: [{ bearerAuth: [] }] })
    async addStaff(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
        @Body({ type: AddStaffDto }) body: AddStaffDto,
    ) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        if (role !== RoleName.Admin && role !== RoleName.Owner) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!isOwner) {
                return { message: 'Forbidden' };
            }
        }

        const staffRepo = dataSource.getRepository(RestaurantStaff);
        const staffRecord = staffRepo.create({
            user_id: body.user_id,
            restaurant_id: id,
        });

        const saved = await staffRepo.save(staffRecord);

        // Assign Manager role to user
        const roleRepo = dataSource.getRepository(Role);
        let managerRole = await roleRepo.findOneBy({ name: RoleName.Manager });
        if (!managerRole) {
            managerRole = roleRepo.create({ name: RoleName.Manager });
            await roleRepo.save(managerRole);
        }

        const userRepo = dataSource.getRepository(User);
        await userRepo.update({ user_id: body.user_id }, { role_id: managerRole.role_id });

        return saved;
    }

    @Delete('/:id/staff/:userId')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Remove staff from a restaurant', security: [{ bearerAuth: [] }] })
    async removeStaff(
        @Param('id') id: number,
        @Param('userId') userId: number,
        @Req() request: RequestWithUser,
    ) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        if (role !== RoleName.Admin && role !== RoleName.Owner) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!isOwner) {
                return { message: 'Forbidden' };
            }
        }

        const staffRepo = dataSource.getRepository(RestaurantStaff);
        await staffRepo.delete({ user_id: userId, restaurant_id: id });
        return { message: 'Staff member removed' };
    }


    @Get('/:id/menus')
    @OpenAPI({ summary: 'Get menus for a restaurant' })
    async getMenus(@Param('id') id: number) {
        const menuRepo = dataSource.getRepository(Menu);
        return await menuRepo.find({ where: { restaurant_id: id } });
    }

    @Post('/:id/menus')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create a menu for a restaurant', security: [{ bearerAuth: [] }] })
    async createMenu(
        @Param('id') id: number,
        @Body({ type: CreateMenuDto }) body: CreateMenuDto,
    ) {
        const menuRepo = dataSource.getRepository(Menu);
        const menu = menuRepo.create({ ...body, restaurant_id: id });
        return await menuRepo.save(menu);
    }

    @Get('/:id/menu')
    @OpenAPI({ summary: 'Get full menu with items for a restaurant' })
    async getFullMenu(@Param('id') id: number) {
        const menuRepo = dataSource.getRepository(Menu);
        return await menuRepo.find({
            where: { restaurant_id: id },
            relations: ['menuItems'],
        });
    }


    @Get('/:id/tables')
    @OpenAPI({ summary: 'Get tables for a restaurant' })
    async getTables(@Param('id') id: number) {
        const tableRepo = dataSource.getRepository(Table);
        return await tableRepo.find({ where: { restaurant_id: id } });
    }


    @Get('/:id/reservations')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get reservations for a restaurant', security: [{ bearerAuth: [] }] })
    async getRestaurantReservations(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        const isOwner = role === RoleName.Owner || role === RoleName.Admin;
        if (!isOwner) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const ownerRecord = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            const staffRepo = dataSource.getRepository(RestaurantStaff);
            const staffRecord = await staffRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!ownerRecord && !staffRecord) {
                return { message: 'Forbidden' };
            }
        }

        const tableRepo = dataSource.getRepository(Table);
        const tables = await tableRepo.find({ where: { restaurant_id: id } });
        const tableIds = tables.map((t) => t.table_id);

        if (tableIds.length === 0) return [];

        const reservationRepo = dataSource.getRepository(Reservation);
        return await reservationRepo
            .createQueryBuilder('reservation')
            .where('reservation.table_id IN (:...tableIds)', { tableIds })
            .leftJoinAndSelect('reservation.user', 'user')
            .leftJoinAndSelect('reservation.table', 'table')
            .getMany();
    }


    @Get('/:id/reviews')
    @OpenAPI({ summary: 'Get reviews for a restaurant' })
    async getReviews(@Param('id') id: number) {
        const reviewRepo = dataSource.getRepository(Review);
        return await reviewRepo.find({
            where: { restaurant_id: id },
            relations: ['user'],
        });
    }

    @Post('/:id/reviews')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create a review for a restaurant', security: [{ bearerAuth: [] }] })
    async createReview(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
        @Body({ type: CreateReviewDto }) body: CreateReviewDto,
    ) {
        const { user } = request;
        const reviewRepo = dataSource.getRepository(Review);
        const review = reviewRepo.create({
            ...body,
            restaurant_id: id,
            user_id: user.id,
        });
        return await reviewRepo.save(review);
    }


    @Get('/:id/photos')
    @OpenAPI({ summary: 'Get photos for a restaurant' })
    async getPhotos(@Param('id') id: number) {
        const photoRepo = dataSource.getRepository(RestaurantPhoto);
        return await photoRepo.find({ where: { restaurant_id: id } });
    }

    @Post('/:id/photos')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Add a photo to a restaurant', security: [{ bearerAuth: [] }] })
    async addPhoto(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
        @Body({ type: CreatePhotoDto }) body: CreatePhotoDto,
    ) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        if (role !== RoleName.Admin && role !== RoleName.Owner && role !== RoleName.Manager) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            const staffRepo = dataSource.getRepository(RestaurantStaff);
            const isStaff = await staffRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!isOwner && !isStaff) {
                return { message: 'Forbidden' };
            }
        }

        const photoRepo = dataSource.getRepository(RestaurantPhoto);
        const photo = photoRepo.create({ ...body, restaurant_id: id });
        return await photoRepo.save(photo);
    }
}

export default RestaurantController;
