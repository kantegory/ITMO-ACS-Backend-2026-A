import {
    Body, Delete, Get, HttpCode, Param, Patch, Post, Req, UseBefore,
} from 'routing-controllers';
import { Request } from 'express';
import { OpenAPI } from 'routing-controllers-openapi';
import axios from 'axios';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Restaurant } from '../models/restaurant.entity';
import { RestaurantOwner } from '../models/restaurant-owner.entity';
import { RestaurantStaff } from '../models/restaurant-staff.entity';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { RestaurantStatus, RoleName } from '../common/enums';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import SETTINGS from '../config/settings';
import { CreateRestaurantDto, UpdateRestaurantDto, AddStaffDto, CreatePhotoDto } from '../dto/restaurant.dto';
import { publishRestaurantStatusChanged } from '../messaging/publisher';

async function getCallerRole(userId: number): Promise<RoleName | null> {
    try {
        const { data } = await axios.get(`${SETTINGS.AUTH_SERVICE_URL}/internal/users/${userId}`);
        return data.role || null;
    } catch {
        return null;
    }
}

@EntityController({ baseRoute: '/restaurants', entity: Restaurant })
class RestaurantController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Get all verified restaurants with optional filters' })
    async getAll(@Req() req: Request) {
        const { city, cuisine_id, price } = req.query as Record<string, string>;
        const cuisineId = cuisine_id ? parseInt(cuisine_id) : undefined;

        const qb = this.repository
            .createQueryBuilder('restaurant')
            .where('restaurant.status = :status', { status: RestaurantStatus.Verified });

        if (city) qb.andWhere('restaurant.city = :city', { city });
        if (price) qb.andWhere('restaurant.price = :price', { price });
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
    async create(@Req() request: RequestWithUser, @Body({ type: CreateRestaurantDto }) body: CreateRestaurantDto) {
        const { user } = request;

        const newRestaurant = this.repository.create({ ...body, status: RestaurantStatus.Pending });
        const savedRestaurant = await this.repository.save(newRestaurant) as Restaurant;

        const ownerRepo = dataSource.getRepository(RestaurantOwner);
        await ownerRepo.save(ownerRepo.create({ user_id: user.id, restaurant_id: savedRestaurant.restaurant_id }));

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
    async update(@Param('id') id: number, @Req() request: RequestWithUser, @Body({ type: UpdateRestaurantDto }) body: UpdateRestaurantDto) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        const restaurant = await this.repository.findOneBy({ restaurant_id: id }) as Restaurant;
        if (!restaurant) return { message: 'Restaurant not found' };

        if (role !== RoleName.Admin) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!isOwner) return { message: 'Forbidden: not the owner' };
        }

        Object.assign(restaurant, body);
        return await this.repository.save(restaurant);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete restaurant', security: [{ bearerAuth: [] }] })
    async delete(@Param('id') id: number, @Req() request: RequestWithUser) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        const restaurant = await this.repository.findOneBy({ restaurant_id: id });
        if (!restaurant) return { message: 'Restaurant not found' };

        if (role !== RoleName.Admin) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!isOwner) return { message: 'Forbidden: not the owner' };
        }

        await this.repository.delete({ restaurant_id: id });
        return { message: 'Restaurant deleted' };
    }

    @Patch('/:id/verify')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Verify a restaurant (Admin only)', security: [{ bearerAuth: [] }] })
    async verify(@Param('id') id: number, @Req() request: RequestWithUser) {
        const { user } = request;
        const role = await getCallerRole(user.id);
        if (role !== RoleName.Admin) return { message: 'Forbidden: admin only' };

        const restaurant = await this.repository.findOneBy({ restaurant_id: id }) as Restaurant;
        if (!restaurant) return { message: 'Restaurant not found' };

        const oldStatus = restaurant.status;
        restaurant.status = RestaurantStatus.Verified;
        const saved = await this.repository.save(restaurant) as Restaurant;

        const ownerRepo = dataSource.getRepository(RestaurantOwner);
        const owner = await ownerRepo.findOneBy({ restaurant_id: id });
        if (owner) {
            await publishRestaurantStatusChanged({
                restaurant_id: id,
                restaurant_name: restaurant.name,
                old_status: oldStatus,
                new_status: RestaurantStatus.Verified,
                owner_user_id: owner.user_id,
            });
        }

        return saved;
    }

    @Patch('/:id/reject')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Reject a restaurant (Admin only)', security: [{ bearerAuth: [] }] })
    async reject(@Param('id') id: number, @Req() request: RequestWithUser) {
        const { user } = request;
        const role = await getCallerRole(user.id);
        if (role !== RoleName.Admin) return { message: 'Forbidden: admin only' };

        const restaurant = await this.repository.findOneBy({ restaurant_id: id }) as Restaurant;
        if (!restaurant) return { message: 'Restaurant not found' };

        const oldStatus = restaurant.status;
        restaurant.status = RestaurantStatus.Rejected;
        const saved = await this.repository.save(restaurant) as Restaurant;

        const ownerRepo = dataSource.getRepository(RestaurantOwner);
        const owner = await ownerRepo.findOneBy({ restaurant_id: id });
        if (owner) {
            await publishRestaurantStatusChanged({
                restaurant_id: id,
                restaurant_name: restaurant.name,
                old_status: oldStatus,
                new_status: RestaurantStatus.Rejected,
                owner_user_id: owner.user_id,
            });
        }

        return saved;
    }

    // ── Staff ──────────────────────────────────────────────────────────────────

    @Get('/:id/staff')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get staff for a restaurant', security: [{ bearerAuth: [] }] })
    async getStaff(@Param('id') id: number) {
        const staffRepo = dataSource.getRepository(RestaurantStaff);
        const staff = await staffRepo.find({ where: { restaurant_id: id } });

        const userIds = staff.map((s) => s.user_id).join(',');
        if (!userIds) return staff;

        try {
            const { data: users } = await axios.get(
                `${SETTINGS.AUTH_SERVICE_URL}/internal/users`,
                { params: { ids: userIds } },
            );
            const userMap = new Map(users.map((u: any) => [u.user_id, u]));
            return staff.map((s) => ({ ...s, user: userMap.get(s.user_id) }));
        } catch {
            return staff;
        }
    }

    @Post('/:id/staff')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Add staff to a restaurant', security: [{ bearerAuth: [] }] })
    async addStaff(@Param('id') id: number, @Req() request: RequestWithUser, @Body({ type: AddStaffDto }) body: AddStaffDto) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        if (role !== RoleName.Admin && role !== RoleName.Owner) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!isOwner) return { message: 'Forbidden' };
        }

        const staffRepo = dataSource.getRepository(RestaurantStaff);
        const staffRecord = staffRepo.create({ user_id: body.user_id, restaurant_id: id });
        return await staffRepo.save(staffRecord);
    }

    @Delete('/:id/staff/:userId')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Remove staff from a restaurant', security: [{ bearerAuth: [] }] })
    async removeStaff(@Param('id') id: number, @Param('userId') userId: number, @Req() request: RequestWithUser) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        if (role !== RoleName.Admin && role !== RoleName.Owner) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!isOwner) return { message: 'Forbidden' };
        }

        const staffRepo = dataSource.getRepository(RestaurantStaff);
        await staffRepo.delete({ user_id: userId, restaurant_id: id });
        return { message: 'Staff member removed' };
    }

    // ── Menus ─────────────────────────────────────────────────────────────────

    @Get('/:id/menus')
    @OpenAPI({ summary: 'Get menus for a restaurant' })
    async getMenus(@Param('id') id: number) {
        try {
            const { data } = await axios.get(`${SETTINGS.MENU_SERVICE_URL}/internal/menus`, {
                params: { restaurant_id: id },
            });
            return data;
        } catch {
            return [];
        }
    }

    @Get('/:id/menu')
    @OpenAPI({ summary: 'Get full menu with items for a restaurant' })
    async getFullMenu(@Param('id') id: number) {
        try {
            const { data } = await axios.get(`${SETTINGS.MENU_SERVICE_URL}/internal/menus`, {
                params: { restaurant_id: id, include_items: true },
            });
            return data;
        } catch {
            return [];
        }
    }

    // ── Tables ────────────────────────────────────────────────────────────────

    @Get('/:id/tables')
    @OpenAPI({ summary: 'Get tables for a restaurant' })
    async getTables(@Param('id') id: number) {
        try {
            const { data } = await axios.get(`${SETTINGS.RESERVATION_SERVICE_URL}/internal/tables`, {
                params: { restaurant_id: id },
            });
            return data;
        } catch {
            return [];
        }
    }

    // ── Reservations ──────────────────────────────────────────────────────────

    @Get('/:id/reservations')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get reservations for a restaurant', security: [{ bearerAuth: [] }] })
    async getRestaurantReservations(@Param('id') id: number, @Req() request: RequestWithUser) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        if (role !== RoleName.Owner && role !== RoleName.Admin) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const ownerRecord = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            const staffRepo = dataSource.getRepository(RestaurantStaff);
            const staffRecord = await staffRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!ownerRecord && !staffRecord) return { message: 'Forbidden' };
        }

        try {
            const { data } = await axios.get(`${SETTINGS.RESERVATION_SERVICE_URL}/internal/reservations`, {
                params: { restaurant_id: id },
            });
            return data;
        } catch {
            return [];
        }
    }

    // ── Reviews ───────────────────────────────────────────────────────────────

    @Get('/:id/reviews')
    @OpenAPI({ summary: 'Get reviews for a restaurant' })
    async getReviews(@Param('id') id: number) {
        try {
            const { data } = await axios.get(`${SETTINGS.REVIEW_SERVICE_URL}/internal/reviews`, {
                params: { restaurant_id: id },
            });
            return data;
        } catch {
            return [];
        }
    }

    // ── Photos ────────────────────────────────────────────────────────────────

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
    async addPhoto(@Param('id') id: number, @Req() request: RequestWithUser, @Body({ type: CreatePhotoDto }) body: CreatePhotoDto) {
        const { user } = request;
        const role = await getCallerRole(user.id);

        if (role !== RoleName.Admin && role !== RoleName.Owner && role !== RoleName.Manager) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            const staffRepo = dataSource.getRepository(RestaurantStaff);
            const isStaff = await staffRepo.findOneBy({ user_id: user.id, restaurant_id: id });
            if (!isOwner && !isStaff) return { message: 'Forbidden' };
        }

        const photoRepo = dataSource.getRepository(RestaurantPhoto);
        const photo = photoRepo.create({ ...body, restaurant_id: id });
        return await photoRepo.save(photo);
    }
}

export default RestaurantController;
