/**
 * Демонстрационные данные recipe-service.
 * authorId ссылается на пользователей user-service (1 — dr_lecter, 2 — jack_crawford,
 * 3 — will_graham): межбазовых внешних ключей нет, поэтому порядок наполнения баз
 * фиксируется только соглашением о демо-данных.
 * Запуск: npm run seed
 */
import 'reflect-metadata';
import { AppDataSource, initializeDatabase } from './config/data-source';
import {
  Category, Cuisine, Ingredient, MediaType, Recipe, RecipeDifficulty, RecipeIngredient,
  RecipeMedia, RecipeStatus, RecipeStep, Tag,
} from './models';
import { slugify } from './utils/slugify';
import { bus, recipeEvents } from './messaging/publisher';

const LECTER = '1';
const CRAWFORD = '2';
const GRAHAM = '3';

const CATEGORIES = [
  ['Закуски', 'Небольшие блюда, подаваемые перед основным'],
  ['Супы', 'Первые блюда'],
  ['Основные блюда', 'Горячее из мяса, рыбы и овощей'],
  ['Десерты', 'Сладкое завершение ужина'],
  ['Завтраки', 'Блюда для начала дня'],
  ['Напитки', 'Коктейли, настойки и прочее'],
];

const CUISINES = ['Итальянская', 'Французская', 'Японская', 'Грузинская', 'Русская', 'Балтийская'];

const TAGS = ['ужин', 'изысканное', 'вино', 'быстро', 'праздничное', 'мясо', 'рыба', 'веган'];

const INGREDIENTS: Array<[string, string, number | null]> = [
  ['Телячья голяшка', 'г', 172],
  ['Говяжья вырезка', 'г', 187],
  ['Куриная печень', 'г', 136],
  ['Лук репчатый', 'г', 41],
  ['Морковь', 'г', 35],
  ['Сельдерей', 'г', 13],
  ['Томаты в собственном соку', 'г', 32],
  ['Белое сухое вино', 'мл', 82],
  ['Красное сухое вино', 'мл', 85],
  ['Оливковое масло', 'мл', 884],
  ['Сливочное масло', 'г', 717],
  ['Чеснок', 'г', 149],
  ['Розмарин', 'г', 131],
  ['Тимьян', 'г', 101],
  ['Петрушка', 'г', 36],
  ['Базилик', 'г', 23],
  ['Мука пшеничная', 'г', 364],
  ['Соль', 'г', null],
  ['Чёрный перец', 'г', null],
  ['Лимон', 'шт', 29],
  ['Сливки 33%', 'мл', 337],
  ['Тёмный шоколад 70%', 'г', 546],
  ['Яйцо куриное', 'шт', 157],
  ['Сахар', 'г', 399],
  ['Спаржа', 'г', 20],
  ['Пармезан', 'г', 431],
  ['Рис арборио', 'г', 350],
  ['Куриный бульон', 'мл', 15],
  ['Трюфельное масло', 'мл', 880],
  ['Фенхель', 'г', 31],
];

interface SeedRecipe {
  authorId: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  cuisine: string;
  difficulty: RecipeDifficulty;
  prep: number;
  cook: number;
  servings: number;
  calories: number;
  tags: string[];
  ingredients: Array<[string, number, string, string | null]>;
  steps: Array<[string, number | null]>;
  media: Array<[string, MediaType, string]>;
  video?: string;
}

const RECIPES: SeedRecipe[] = [
  {
    authorId: LECTER,
    title: 'Оссо буко по-милански',
    summary: 'Томлёная телячья голяшка с белым вином и цитрусовой густой подливой.',
    description: 'Классика ломбардской кухни. Мясо томится почти два часа, и только тогда ' +
      'соединительная ткань превращается в шелковистый соус.',
    category: 'Основные блюда', cuisine: 'Итальянская', difficulty: RecipeDifficulty.HARD,
    prep: 30, cook: 120, servings: 4, calories: 620,
    tags: ['ужин', 'изысканное', 'мясо', 'вино'],
    ingredients: [
      ['Телячья голяшка', 1200, 'г', 'нарезать поперёк на 4 куска'],
      ['Лук репчатый', 150, 'г', 'мелкий кубик'],
      ['Морковь', 120, 'г', 'мелкий кубик'],
      ['Сельдерей', 100, 'г', 'мелкий кубик'],
      ['Белое сухое вино', 250, 'мл', null],
      ['Томаты в собственном соку', 400, 'г', null],
      ['Мука пшеничная', 60, 'г', 'для панировки'],
      ['Оливковое масло', 50, 'мл', null],
      ['Лимон', 1, 'шт', 'только цедра'],
      ['Петрушка', 20, 'г', null],
    ],
    steps: [
      ['Обвязать куски голяшки шпагатом, обсушить, посолить и обвалять в муке.', 10],
      ['Обжарить мясо на оливковом масле до глубокой корочки, отложить.', 12],
      ['В той же посуде томить лук, морковь и сельдерей до мягкости.', 10],
      ['Влить вино, выпарить наполовину, добавить томаты.', 8],
      ['Вернуть мясо, накрыть и томить на малом огне 1,5–2 часа.', 110],
      ['Приготовить гремолату из цедры, чеснока и петрушки, посыпать перед подачей.', 5],
    ],
    media: [
      ['/images/osso-buco.jpg', MediaType.PHOTO, 'Голяшка с мозговой костью в соусе'],
      ['/images/osso-buco-2.jpg', MediaType.PHOTO, 'Подача на широкой тарелке'],
    ],
    video: 'https://example.com/video/osso-buco',
  },
  {
    authorId: LECTER,
    title: 'Паштет из куриной печени с портвейном',
    summary: 'Шелковистый паштет, который подают охлаждённым с поджаренной бриошью.',
    description: 'Главное — не перегреть печень: она должна остаться розовой внутри.',
    category: 'Закуски', cuisine: 'Французская', difficulty: RecipeDifficulty.MEDIUM,
    prep: 20, cook: 25, servings: 6, calories: 310,
    tags: ['изысканное', 'праздничное'],
    ingredients: [
      ['Куриная печень', 500, 'г', 'зачистить от плёнок'],
      ['Сливочное масло', 200, 'г', 'холодное, кубиками'],
      ['Лук репчатый', 100, 'г', null],
      ['Чеснок', 10, 'г', null],
      ['Красное сухое вино', 80, 'мл', null],
      ['Тимьян', 5, 'г', null],
      ['Соль', 8, 'г', null],
    ],
    steps: [
      ['Обжарить лук и чеснок на части масла до прозрачности.', 6],
      ['Добавить печень и обжарить по 2 минуты с каждой стороны.', 5],
      ['Влить вино, выпарить, снять с огня, дать немного остыть.', 6],
      ['Пробить блендером, вмешивая холодное масло до гладкости.', 5],
      ['Протереть через сито, разложить по формам и охладить 4 часа.', 240],
    ],
    media: [['/images/pate.jpg', MediaType.PHOTO, 'Паштет в форме с подачей']],
  },
  {
    authorId: LECTER,
    title: 'Ризотто с трюфельным маслом и спаржей',
    summary: 'Сливочное ризотто, в котором спаржа остаётся хрустящей.',
    description: 'Бульон добавляют половниками, не переставая помешивать.',
    category: 'Основные блюда', cuisine: 'Итальянская', difficulty: RecipeDifficulty.MEDIUM,
    prep: 15, cook: 30, servings: 2, calories: 540,
    tags: ['ужин', 'изысканное'],
    ingredients: [
      ['Рис арборио', 180, 'г', null],
      ['Куриный бульон', 800, 'мл', 'горячий'],
      ['Спаржа', 200, 'г', 'бланшировать 2 минуты'],
      ['Пармезан', 60, 'г', 'натереть'],
      ['Сливочное масло', 40, 'г', null],
      ['Белое сухое вино', 80, 'мл', null],
      ['Трюфельное масло', 10, 'мл', 'в самом конце'],
    ],
    steps: [
      ['Обжарить рис в масле до прозрачности краёв.', 3],
      ['Влить вино и дать полностью выпариться.', 3],
      ['Добавлять бульон половниками, помешивая, 18 минут.', 18],
      ['Снять с огня, вмешать масло и пармезан.', 3],
      ['Добавить спаржу и несколько капель трюфельного масла.', 2],
    ],
    media: [['/images/risotto.jpg', MediaType.PHOTO, 'Ризотто со спаржей']],
  },
  {
    authorId: GRAHAM,
    title: 'Шоколадный фондан на двоих',
    summary: 'Десерт с текучей серединой — ровно двенадцать минут в духовке.',
    description: 'Формы обязательно смазать маслом и присыпать какао.',
    category: 'Десерты', cuisine: 'Французская', difficulty: RecipeDifficulty.EASY,
    prep: 15, cook: 12, servings: 2, calories: 480,
    tags: ['праздничное', 'быстро'],
    ingredients: [
      ['Тёмный шоколад 70%', 100, 'г', null],
      ['Сливочное масло', 80, 'г', null],
      ['Яйцо куриное', 2, 'шт', null],
      ['Сахар', 60, 'г', null],
      ['Мука пшеничная', 30, 'г', null],
    ],
    steps: [
      ['Растопить шоколад с маслом на водяной бане.', 6],
      ['Взбить яйца с сахаром до светлой пены.', 4],
      ['Соединить массы, всыпать муку, разлить по формам.', 4],
      ['Выпекать 12 минут при 200 °C и сразу подавать.', 12],
    ],
    media: [['/images/fondant.jpg', MediaType.PHOTO, 'Разрез фондана']],
  },
  {
    authorId: CRAWFORD,
    title: 'Крепкий бульон из говядины',
    summary: 'Простой прозрачный бульон, который долго держит тепло.',
    description: 'Пену снимать первые двадцать минут, иначе бульон помутнеет.',
    category: 'Супы', cuisine: 'Русская', difficulty: RecipeDifficulty.EASY,
    prep: 10, cook: 180, servings: 6, calories: 90,
    tags: ['мясо'],
    ingredients: [
      ['Говяжья вырезка', 800, 'г', null],
      ['Лук репчатый', 120, 'г', null],
      ['Морковь', 100, 'г', null],
      ['Соль', 10, 'г', null],
      ['Чёрный перец', 3, 'г', null],
    ],
    steps: [
      ['Залить мясо холодной водой и довести до кипения.', 20],
      ['Снять пену, добавить овощи, варить на малом огне 2,5 часа.', 150],
      ['Процедить и приправить.', 10],
    ],
    media: [['/images/broth.jpg', MediaType.PHOTO, 'Прозрачный бульон в белой миске']],
  },
  {
    authorId: CRAWFORD,
    title: 'Запечённый фенхель с лимоном',
    summary: 'Гарнир, который не отвлекает от основного блюда.',
    description: 'Фенхель карамелизуется по краям и остаётся сочным внутри.',
    category: 'Закуски', cuisine: 'Итальянская', difficulty: RecipeDifficulty.EASY,
    prep: 10, cook: 35, servings: 4, calories: 140,
    tags: ['веган', 'быстро'],
    ingredients: [
      ['Фенхель', 600, 'г', 'разрезать на дольки'],
      ['Оливковое масло', 40, 'мл', null],
      ['Лимон', 1, 'шт', 'сок и цедра'],
      ['Соль', 6, 'г', null],
    ],
    steps: [
      ['Разогреть духовку до 200 °C.', 10],
      ['Смешать фенхель с маслом, соком лимона и солью.', 5],
      ['Запекать 35 минут до золотистых краёв.', 35],
    ],
    media: [['/images/fennel.jpg', MediaType.PHOTO, 'Дольки фенхеля с цитрусовой заправкой']],
  },
];

const seed = async (): Promise<void> => {
  await initializeDatabase();
  await bus.connect();

  const created: Recipe[] = [];

  await AppDataSource.transaction(async (manager) => {
    await manager.query(
      'TRUNCATE TABLE recipe_tags, recipe_media, recipe_steps, recipe_ingredients, ' +
      'recipes, ingredients, tags, cuisines, categories RESTART IDENTITY CASCADE',
    );

    const categories = await manager.save(CATEGORIES.map(([name, description]) =>
      manager.create(Category, { name, slug: slugify(name), description })));
    const cuisines = await manager.save(CUISINES.map((name) =>
      manager.create(Cuisine, { name, slug: slugify(name) })));
    const tags = await manager.save(TAGS.map((name) =>
      manager.create(Tag, { name, slug: slugify(name) })));
    const ingredients = await manager.save(INGREDIENTS.map(([name, unit, kcal]) =>
      manager.create(Ingredient, {
        name: name as string,
        defaultUnit: unit as string,
        kcalPer100: kcal === null ? null : String(kcal),
      })));

    const cat = (name: string) => categories.find((item) => item.name === name)!;
    const cui = (name: string) => cuisines.find((item) => item.name === name)!;
    const tag = (name: string) => tags.find((item) => item.name === name)!;
    const ing = (name: string) => ingredients.find((item) => item.name === name)!;

    for (const item of RECIPES) {
      const recipe = await manager.save(manager.create(Recipe, {
        authorId: item.authorId,
        categoryId: cat(item.category).id,
        cuisineId: cui(item.cuisine).id,
        title: item.title,
        slug: slugify(item.title),
        summary: item.summary,
        description: item.description,
        difficulty: item.difficulty,
        prepTimeMinutes: item.prep,
        cookTimeMinutes: item.cook,
        servings: item.servings,
        calories: item.calories,
        coverImageUrl: item.media[0]?.[0] ?? null,
        videoUrl: item.video ?? null,
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: item.tags.map(tag),
      }));

      await manager.save(item.ingredients.map(([name, quantity, unit, note], index) =>
        manager.create(RecipeIngredient, {
          recipeId: recipe.id, ingredientId: ing(name).id,
          quantity: String(quantity), unit, note, position: index,
        })));
      await manager.save(item.steps.map(([instruction, duration], index) =>
        manager.create(RecipeStep, {
          recipeId: recipe.id, stepNumber: index + 1, instruction, durationMinutes: duration,
        })));
      if (item.media.length) {
        await manager.save(item.media.map(([url, type, caption], index) =>
          manager.create(RecipeMedia, { recipeId: recipe.id, url, type, caption, position: index })));
      }
      created.push(recipe);
    }

    console.log(`[seed] справочники: ${categories.length}/${cuisines.length}/${tags.length}/${ingredients.length}`);
    console.log(`[seed] рецептов: ${created.length}`);
  });

  // после фиксации транзакции сообщаем остальным сервисам о публикациях
  for (const recipe of created) await recipeEvents.published(recipe);

  await bus.close();
  await AppDataSource.destroy();
  console.log('[seed] recipe-service готов');
};

seed().catch((error) => { console.error('[seed]', error); process.exit(1); });
