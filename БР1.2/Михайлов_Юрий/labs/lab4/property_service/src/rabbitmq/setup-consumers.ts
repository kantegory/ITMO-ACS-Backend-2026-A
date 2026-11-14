import dataSource from '../config/data-source';
import { Property } from '../models/property.entity';
import { PropertyLocation } from '../models/property-location.entity';
import { PropertyAttributes } from '../models/property-attributes.entity';
import { PropertyImage } from '../models/property-image.entity';

export function setupConsumers() {
    const { subscribe } = require('./consumer');

    subscribe('user.deleted', async (data: { userId: number }) => {
        console.log(`Property Service: Processing user.deleted for userId: ${data.userId}`);

        const propertyRepo = dataSource.getRepository(Property);
        const locationRepo = dataSource.getRepository(PropertyLocation);
        const attributesRepo = dataSource.getRepository(PropertyAttributes);
        const imageRepo = dataSource.getRepository(PropertyImage);

        // Находим все объявления пользователя
        const properties = await propertyRepo.find({ where: { owner_id: data.userId } });

        for (const property of properties) {
            // Удаляем связанные данные (каскадно)
            await locationRepo.delete({ property_id: property.id });
            await attributesRepo.delete({ property_id: property.id });
            await imageRepo.delete({ property_id: property.id });
            await propertyRepo.delete({ id: property.id });

            console.log(`Deleted property ${property.id} for user ${data.userId}`);
        }
    });
}
