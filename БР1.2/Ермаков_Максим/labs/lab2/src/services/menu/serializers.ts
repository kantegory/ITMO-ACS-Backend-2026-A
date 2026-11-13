import { MenuCategory, MenuItem } from './entities';

const toIsoString = (value?: Date | null) => (value ? value.toISOString() : null);

export const serializeMenuItem = (item: MenuItem) => ({
    id: item.id,
    title: item.title,
    description: item.description || undefined,
    price: item.price,
    weight: item.weight || undefined,
    isAvailable: item.isAvailable,
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
});

export const serializeMenuCategory = (category: MenuCategory) => ({
    id: category.id,
    restaurantId: category.restaurantId,
    title: category.title,
    items: (category.items || []).map(serializeMenuItem),
    createdAt: toIsoString(category.createdAt),
    updatedAt: toIsoString(category.updatedAt),
});
