import { Get, JsonController, QueryParam } from 'routing-controllers';
import dataSource from '../config/data-source';
import { Menu } from '../models/menu.entity';

@JsonController('/internal')
class InternalController {
    @Get('/menus')
    async getMenus(
        @QueryParam('restaurant_id') restaurantId: number,
        @QueryParam('include_items') includeItems: boolean,
    ) {
        if (!restaurantId) {
            return { message: 'restaurant_id is required' };
        }

        const menuRepo = dataSource.getRepository(Menu);
        const relations = includeItems ? ['menuItems'] : [];

        return await menuRepo.find({ where: { restaurant_id: restaurantId }, relations });
    }
}

export default InternalController;
