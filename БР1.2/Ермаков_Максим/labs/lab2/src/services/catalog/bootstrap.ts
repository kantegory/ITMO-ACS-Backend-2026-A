import { catalogDataSource } from './data-source';
import { Cuisine } from './entities';

const DEFAULT_CUISINES = [
    'Italian',
    'Japanese',
    'Georgian',
    'French',
    'Russian',
    'Indian',
    'Chinese',
    'Mexican',
];

export const bootstrapCatalogData = async () => {
    const cuisines = catalogDataSource.getRepository(Cuisine);
    if (await cuisines.count()) {
        return;
    }

    await cuisines.save(DEFAULT_CUISINES.map((title) => cuisines.create({ title })));
};
