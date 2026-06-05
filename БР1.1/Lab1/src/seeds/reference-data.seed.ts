import { DataSource } from 'typeorm';

import { DifficultyLevel, Ingredient, RecipeCategory } from '../models';

const DEFAULT_CATEGORIES = [
    'Завтрак',
    'Суп',
    'Салат',
    'Основное блюдо',
    'Десерт',
    'Выпечка',
    'Напиток',
];

const DEFAULT_DIFFICULTY_LEVELS = ['Легкий', 'Средний', 'Сложный'];

const DEFAULT_INGREDIENTS = [
    'Мука',
    'Сахар',
    'Соль',
    'Яйцо',
    'Молоко',
    'Сливочное масло',
    'Оливковое масло',
    'Куриное филе',
    'Картофель',
    'Лук',
    'Чеснок',
    'Томат',
    'Огурец',
    'Сметана',
    'Сыр',
];

const seedIfEmpty = async <T extends { name: string }>(
    dataSource: DataSource,
    entity: { new (): T },
    values: string[],
): Promise<void> => {
    const repository = dataSource.getRepository(entity);
    const count = await repository.count();

    if (count > 0) {
        return;
    }

    const items = values.map((name) => repository.create({ name }));
    await repository.save(items);
};

export const seedReferenceData = async (dataSource: DataSource): Promise<void> => {
    await seedIfEmpty(dataSource, RecipeCategory, DEFAULT_CATEGORIES);
    await seedIfEmpty(dataSource, DifficultyLevel, DEFAULT_DIFFICULTY_LEVELS);
    await seedIfEmpty(dataSource, Ingredient, DEFAULT_INGREDIENTS);
};
