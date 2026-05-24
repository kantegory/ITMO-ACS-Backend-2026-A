import { Delete, Param, UseBefore, Req } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { RestaurantOwner } from '../models/restaurant-owner.entity';
import { RoleName } from '../common/enums';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

@EntityController({ baseRoute: '/photos', entity: RestaurantPhoto })
class PhotoController extends BaseController {
    @Delete('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete a photo', security: [{ bearerAuth: [] }] })
    async delete(@Param('id') id: number, @Req() request: RequestWithUser) {
        const { user } = request;
        const photo = await this.repository.findOneBy({ photo_id: id }) as RestaurantPhoto;
        if (!photo) {
            return { message: 'Photo not found' };
        }

        if (user.role !== RoleName.Admin) {
            const ownerRepo = dataSource.getRepository(RestaurantOwner);
            const isOwner = await ownerRepo.findOneBy({ user_id: user.id, restaurant_id: photo.restaurant_id });
            if (!isOwner) {
                return { message: 'Forbidden' };
            }
        }

        await this.repository.delete({ photo_id: id });
        return { message: 'Photo deleted' };
    }
}

export default PhotoController;
