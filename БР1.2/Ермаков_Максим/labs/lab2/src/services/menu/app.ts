import 'reflect-metadata';
import { asyncHandler, createServiceApp, errorHandler } from '../../common/service-app';
import { notFound } from '../../common/api-error';
import { authContextMiddleware, requireRole } from '../../common/auth-context';
import { UserRole } from '../../common/enums';
import { SETTINGS } from '../../common/settings';
import { serviceRequest } from '../../common/http-client';
import { getParam } from '../../common/request-params';
import { menuDataSource } from './data-source';
import { MenuCategory, MenuItem } from './entities';
import { serializeMenuCategory, serializeMenuItem } from './serializers';

const app = createServiceApp('menu-service');
const categories = () => menuDataSource.getRepository(MenuCategory);
const items = () => menuDataSource.getRepository(MenuItem);

const ensureRestaurantExists = async (restaurantId: string, requestId?: string) => {
    await serviceRequest(
        SETTINGS.CATALOG_SERVICE_URL,
        `/internal/restaurants/${restaurantId}/summary?requirePublished=false`,
        { requestId },
    );
};

const getCategoryOrFail = async (menuCategoryId: string) => {
    const category = await categories().findOne({
        where: { id: menuCategoryId },
        relations: { items: true },
    });
    if (!category) {
        throw notFound('MENU_CATEGORY_NOT_FOUND', 'Menu category is not found');
    }
    return category;
};

app.get('/restaurants/:restaurantId/menu', asyncHandler(async (request, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    const menu = await categories().find({
        where: { restaurantId },
        relations: { items: true },
        order: { title: 'ASC' },
    });
    response.send({
        restaurantId,
        data: menu.map(serializeMenuCategory),
    });
}));

app.post('/admin/restaurants/:restaurantId/menu-categories', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    await ensureRestaurantExists(restaurantId, (request as any).requestId);
    const created = await categories().save(categories().create({
        restaurantId,
        title: request.body?.title,
    }));
    response.status(201).send({ data: serializeMenuCategory({ ...created, items: [] } as MenuCategory) });
}));

app.patch('/admin/menu-categories/:menuCategoryId', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const category = await getCategoryOrFail(getParam(request.params.menuCategoryId, 'menuCategoryId'));
    category.title = request.body?.title ?? category.title;
    response.send({ data: serializeMenuCategory(await categories().save(category)) });
}));

app.post('/admin/menu-categories/:menuCategoryId/items', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const category = await getCategoryOrFail(getParam(request.params.menuCategoryId, 'menuCategoryId'));
    const body = request.body || {};
    const created = await items().save(items().create({
        title: body.title,
        description: body.description,
        price: Number(body.price),
        weight: body.weight,
        isAvailable: body.isAvailable ?? true,
        menuCategory: category,
    }));
    response.status(201).send({ data: serializeMenuItem(created) });
}));

app.patch('/admin/menu-items/:menuItemId', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const item = await items().findOne({
        where: { id: getParam(request.params.menuItemId, 'menuItemId') },
        relations: { menuCategory: true },
    });
    if (!item) {
        throw notFound('MENU_ITEM_NOT_FOUND', 'Menu item is not found');
    }
    const body = request.body || {};
    Object.assign(item, {
        title: body.title ?? item.title,
        description: body.description !== undefined ? body.description : item.description,
        price: body.price !== undefined ? Number(body.price) : item.price,
        weight: body.weight !== undefined ? body.weight : item.weight,
        isAvailable: body.isAvailable ?? item.isAvailable,
    });
    response.send({ data: serializeMenuItem(await items().save(item)) });
}));

app.get('/internal/restaurants/:restaurantId/menu-summary', asyncHandler(async (request, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    const menu = await categories().find({
        where: { restaurantId },
        relations: { items: true },
        order: { title: 'ASC' },
    });
    response.send({
        restaurantId,
        data: menu.map(serializeMenuCategory),
    });
}));

app.use(errorHandler);

menuDataSource.initialize()
    .then(() => {
        app.listen(SETTINGS.MENU_PORT, SETTINGS.MENU_HOST, () => {
            console.log(`menu-service listening at http://${SETTINGS.MENU_HOST}:${SETTINGS.MENU_PORT}`);
        });
    })
    .catch((error) => {
        console.error('menu-service failed to start', error);
        process.exit(1);
    });
