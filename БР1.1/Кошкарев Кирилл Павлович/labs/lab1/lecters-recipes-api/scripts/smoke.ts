/**
 * Приёмочный сценарий Lecter's Recipes API.
 * Требует запущенного сервера: npm run dev (или npm start).
 * Запуск: npm run smoke
 */
const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const API = `${BASE}/api/v1`;

let passed = 0;
let failed = 0;
const failures: string[] = [];

const check = (name: string, condition: boolean, extra?: unknown): void => {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${extra ? ` → ${JSON.stringify(extra).slice(0, 300)}` : ''}`);
  }
};

const section = (title: string): void => console.log(`\n\x1b[1m${title}\x1b[0m`);

interface ApiResult<T = any> {
  status: number;
  body: T;
}

const api = async (
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<ApiResult> => {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body };
};

const unique = Date.now().toString(36);

const run = async (): Promise<void> => {
  console.log(`\x1b[1mSMOKE: Lecter's Recipes API @ ${BASE}\x1b[0m`);

  // ------------------------------------------------------------------ система
  section('1. Служебные эндпоинты');
  const health = await fetch(`${BASE}/health`).then((r) => r.json());
  check('GET /health → status=ok', health.status === 'ok', health);
  const openapi = await fetch(`${BASE}/openapi.json`);
  check('GET /openapi.json → 200', openapi.status === 200);

  // ---------------------------------------------------------------- регистрация
  section('2. Регистрация и вход');
  const chefEmail = `chef_${unique}@lecters.recipes`;
  const chefName = `chef_${unique}`;
  const register = await api('POST', '/auth/register', {
    body: { email: chefEmail, username: chefName, password: 'Chianti2026!', fullName: 'Шеф Тестовый' },
  });
  check('POST /auth/register → 201', register.status === 201, register.body);
  check('регистрация выдаёт accessToken', typeof register.body?.accessToken === 'string');
  check('регистрация не возвращает passwordHash', !('passwordHash' in (register.body?.user ?? {})));
  const chefToken: string = register.body?.accessToken;
  const chefId: number = register.body?.user?.id;

  const duplicate = await api('POST', '/auth/register', {
    body: { email: chefEmail, username: `${chefName}_2`, password: 'Chianti2026!' },
  });
  check('повторный email → 409 CONFLICT', duplicate.status === 409, duplicate.body);

  const badEmail = await api('POST', '/auth/register', {
    body: { email: 'not-an-email', username: 'x', password: '123' },
  });
  check('невалидное тело → 400 VALIDATION_ERROR', badEmail.status === 400 && badEmail.body?.error?.code === 'VALIDATION_ERROR');
  check('ошибка содержит details по полям', Array.isArray(badEmail.body?.error?.details) && badEmail.body.error.details.length >= 2);

  const login = await api('POST', '/auth/login', { body: { email: chefEmail, password: 'Chianti2026!' } });
  check('POST /auth/login → 200', login.status === 200, login.body);
  const wrongLogin = await api('POST', '/auth/login', { body: { email: chefEmail, password: 'wrong-password' } });
  check('неверный пароль → 401 INVALID_CREDENTIALS', wrongLogin.status === 401 && wrongLogin.body?.error?.code === 'INVALID_CREDENTIALS');

  const refreshed = await api('POST', '/auth/refresh', { body: { refreshToken: register.body?.refreshToken } });
  check('POST /auth/refresh → 200 и новый accessToken', refreshed.status === 200 && typeof refreshed.body?.accessToken === 'string');

  // ------------------------------------------------------------- личный кабинет
  section('3. Личный кабинет');
  const noToken = await api('GET', '/users/me');
  check('GET /users/me без токена → 401', noToken.status === 401 && noToken.body?.error?.code === 'UNAUTHORIZED');
  const badToken = await api('GET', '/users/me', { token: 'garbage.token.value' });
  check('GET /users/me с мусорным токеном → 401', badToken.status === 401);

  const me = await api('GET', '/users/me', { token: chefToken });
  check('GET /users/me → 200 и email совпадает', me.status === 200 && me.body?.email === chefEmail, me.body);

  const patched = await api('PATCH', '/users/me', { token: chefToken, body: { bio: 'Готовлю только при свечах.' } });
  check('PATCH /users/me → обновляет bio', patched.status === 200 && patched.body?.bio === 'Готовлю только при свечах.');

  // --------------------------------------------------------------- справочники
  section('4. Справочники');
  const categories = await api('GET', '/categories');
  check('GET /categories → непустой список', categories.status === 200 && categories.body?.data?.length > 0);
  const cuisines = await api('GET', '/cuisines');
  check('GET /cuisines → непустой список', cuisines.status === 200 && cuisines.body?.data?.length > 0);
  const ingredients = await api('GET', '/ingredients?limit=100');
  check('GET /ingredients → постраничный ответ с meta', ingredients.status === 200 && typeof ingredients.body?.meta?.total === 'number');

  const forbiddenCategory = await api('POST', '/categories', { token: chefToken, body: { name: 'Хак' } });
  check('POST /categories обычным пользователем → 403', forbiddenCategory.status === 403, forbiddenCategory.body);

  const list: Array<{ id: number; name: string }> = ingredients.body.data;
  const findIngredient = (name: string) => list.find((item) => item.name === name)!;
  const mainCategory = categories.body.data.find((item: any) => item.name === 'Основные блюда');
  const mainCuisine = cuisines.body.data.find((item: any) => item.name === 'Итальянская');

  // -------------------------------------------------------------------- рецепт
  section('5. Жизненный цикл рецепта');
  const draft = await api('POST', '/recipes', {
    token: chefToken,
    body: {
      title: `Каре ягнёнка в травяной корке ${unique}`,
      summary: 'Розовая середина, хрустящая корка из трав и горчицы.',
      description: 'Мясу обязательно нужно дать отдохнуть под фольгой.',
      categoryId: mainCategory.id,
      cuisineId: mainCuisine.id,
      difficulty: 'hard',
      prepTimeMinutes: 25,
      cookTimeMinutes: 40,
      servings: 2,
      calories: 700,
      tags: ['ужин', 'изысканное'],
      ingredients: [
        { ingredientId: findIngredient('Розмарин').id, quantity: 10, unit: 'г' },
        { ingredientId: findIngredient('Чеснок').id, quantity: 15, unit: 'г', note: 'раздавить' },
        { ingredientId: findIngredient('Оливковое масло').id, quantity: 30, unit: 'мл' },
      ],
      steps: [
        { stepNumber: 1, instruction: 'Зачистить кости и обсушить каре.', durationMinutes: 10 },
        { stepNumber: 2, instruction: 'Обжарить со всех сторон до корочки.', durationMinutes: 8 },
        { stepNumber: 3, instruction: 'Довести в духовке до 54 °C внутри.', durationMinutes: 20 },
      ],
    },
  });
  check('POST /recipes → 201', draft.status === 201, draft.body);
  const recipeId: number = draft.body?.id;
  check('новый рецепт создаётся черновиком', draft.body?.status === 'draft');
  check('состав сохранён (3 позиции)', draft.body?.ingredients?.length === 3);
  check('шаги сохранены (3 шага)', draft.body?.steps?.length === 3);
  check('теги привязаны', draft.body?.tags?.length === 2);
  check('slug сгенерирован транслитерацией', typeof draft.body?.slug === 'string' && /^[a-z0-9-]+$/.test(draft.body.slug));

  const anonDraft = await api('GET', `/recipes/${recipeId}`);
  check('черновик не виден анониму → 404', anonDraft.status === 404, anonDraft.body);
  const ownDraft = await api('GET', `/recipes/${recipeId}`, { token: chefToken });
  check('черновик виден автору → 200', ownDraft.status === 200);

  const published = await api('POST', `/recipes/${recipeId}/publish`, { token: chefToken });
  check('POST /recipes/:id/publish → 200 published', published.status === 200 && published.body?.status === 'published', published.body);
  check('publishedAt проставлен', Boolean(published.body?.publishedAt));

  const emptyDraft = await api('POST', '/recipes', { token: chefToken, body: { title: `Пустой черновик ${unique}` } });
  const cantPublish = await api('POST', `/recipes/${emptyDraft.body.id}/publish`, { token: chefToken });
  check('публикация без шагов → 422 UNPROCESSABLE', cantPublish.status === 422 && cantPublish.body?.error?.code === 'UNPROCESSABLE');

  const patchedRecipe = await api('PATCH', `/recipes/${recipeId}`, {
    token: chefToken, body: { servings: 4, summary: 'Обновлённое описание.' },
  });
  check('PATCH /recipes/:id → 200 и меняет поля', patchedRecipe.status === 200 && patchedRecipe.body?.servings === 4);

  const steps = await api('PUT', `/recipes/${recipeId}/steps`, {
    token: chefToken,
    body: { items: [
      { stepNumber: 1, instruction: 'Замариновать каре в травах на час.', durationMinutes: 60 },
      { stepNumber: 2, instruction: 'Обжарить и довести в духовке.', durationMinutes: 28 },
    ] },
  });
  check('PUT /recipes/:id/steps → заменяет шаги', steps.status === 200 && steps.body?.data?.length === 2, steps.body);

  const badSteps = await api('PUT', `/recipes/${recipeId}/steps`, {
    token: chefToken,
    body: { items: [
      { stepNumber: 1, instruction: 'Первый шаг.' },
      { stepNumber: 1, instruction: 'Дубль номера.' },
    ] },
  });
  check('дубликат номера шага → 422', badSteps.status === 422, badSteps.body);

  const media = await api('POST', `/recipes/${recipeId}/media`, {
    token: chefToken,
    body: { url: 'https://placehold.co/1200x800/1b1817/c8a86b?text=Rack', type: 'photo', caption: 'Каре на доске' },
  });
  check('POST /recipes/:id/media → 201', media.status === 201, media.body);

  const badIngredient = await api('PUT', `/recipes/${recipeId}/ingredients`, {
    token: chefToken, body: { items: [{ ingredientId: 999999, quantity: 1 }] },
  });
  check('несуществующий ингредиент → 404', badIngredient.status === 404, badIngredient.body);

  // ------------------------------------------------------------------- фильтры
  section('6. Поиск и фильтрация');
  const byQuery = await api('GET', `/recipes?q=${encodeURIComponent('каре ягнёнка')}`);
  check('фильтр q находит рецепт', byQuery.status === 200 && byQuery.body.data.some((r: any) => r.id === recipeId), byQuery.body?.meta);
  const byDifficulty = await api('GET', '/recipes?difficulty=hard');
  check('фильтр difficulty=hard', byDifficulty.body.data.every((r: any) => r.difficulty === 'hard'));
  const byCategory = await api('GET', `/recipes?categoryId=${mainCategory.id}`);
  check('фильтр categoryId', byCategory.body.data.every((r: any) => r.category?.id === mainCategory.id));
  const byTime = await api('GET', '/recipes?maxCookTime=40');
  check('фильтр maxCookTime=40', byTime.body.data.every((r: any) => r.cookTimeMinutes <= 40));
  const byIngredient = await api('GET', `/recipes?ingredientId=${findIngredient('Розмарин').id}`);
  check('фильтр по ингредиенту', byIngredient.body.data.some((r: any) => r.id === recipeId), byIngredient.body?.meta);
  const byTag = await api('GET', '/recipes?tag=izyskannoe');
  check('фильтр по тегу', byTag.status === 200 && byTag.body.data.length > 0, byTag.body?.meta);
  const sorted = await api('GET', '/recipes?sort=cookTimeAsc&limit=5');
  const times = sorted.body.data.map((r: any) => r.cookTimeMinutes);
  check('сортировка cookTimeAsc', times.every((t: number, i: number) => i === 0 || times[i - 1] <= t), times);
  const paged = await api('GET', '/recipes?page=1&limit=2');
  check('пагинация: limit=2 и корректная meta', paged.body.data.length <= 2 && paged.body.meta.limit === 2 && paged.body.meta.page === 1, paged.body?.meta);
  const badLimit = await api('GET', '/recipes?limit=999');
  check('limit сверх максимума → 400', badLimit.status === 400, badLimit.body);
  const drafts = await api('GET', '/recipes');
  check('в общей выдаче нет черновиков', drafts.body.data.every((r: any) => r.status === 'published'));

  // ---------------------------------------------------------------- социальные
  section('7. Социальные функции');
  const readerEmail = `reader_${unique}@lecters.recipes`;
  const reader = await api('POST', '/auth/register', {
    body: { email: readerEmail, username: `reader_${unique}`, password: 'Chianti2026!' },
  });
  const readerToken: string = reader.body?.accessToken;
  const readerId: number = reader.body?.user?.id;

  const like = await api('POST', `/recipes/${recipeId}/like`, { token: readerToken });
  check('POST /recipes/:id/like → liked=true', like.status === 200 && like.body?.liked === true, like.body);
  check('счётчик лайков увеличился', like.body?.likesCount >= 1);
  const likeAgain = await api('POST', `/recipes/${recipeId}/like`, { token: readerToken });
  check('повторный лайк идемпотентен', likeAgain.body?.likesCount === like.body?.likesCount);
  const unlike = await api('DELETE', `/recipes/${recipeId}/like`, { token: readerToken });
  check('DELETE like → liked=false', unlike.body?.liked === false);

  const favorite = await api('POST', `/recipes/${recipeId}/favorite`, { token: readerToken });
  check('POST /recipes/:id/favorite → favorite=true', favorite.body?.favorite === true);
  const favorites = await api('GET', '/users/me/favorites', { token: readerToken });
  check('GET /users/me/favorites содержит рецепт', favorites.body.data.some((r: any) => r.id === recipeId));

  const comment = await api('POST', `/recipes/${recipeId}/comments`, {
    token: readerToken, body: { body: 'Идеальная прожарка. Подам с бароло.' },
  });
  check('POST /recipes/:id/comments → 201', comment.status === 201, comment.body);
  const reply = await api('POST', `/recipes/${recipeId}/comments`, {
    token: chefToken, body: { body: 'Бароло — отличный выбор.', parentId: comment.body.id },
  });
  check('ответ на комментарий сохраняет parentId', reply.body?.parentId === comment.body.id);
  const comments = await api('GET', `/recipes/${recipeId}/comments`);
  check('GET комментариев → 2 записи', comments.body.data.length === 2, comments.body?.meta);
  check('комментарий содержит автора', Boolean(comments.body.data[0]?.author?.username));

  const foreignEdit = await api('PATCH', `/comments/${comment.body.id}`, {
    token: chefToken, body: { body: 'Правка чужого комментария' },
  });
  check('правка чужого комментария → 403', foreignEdit.status === 403, foreignEdit.body);
  const ownEdit = await api('PATCH', `/comments/${comment.body.id}`, {
    token: readerToken, body: { body: 'Идеальная прожарка. Подам с бароло 2016 года.' },
  });
  check('правка своего комментария → 200', ownEdit.status === 200);
  const removeComment = await api('DELETE', `/comments/${reply.body.id}`, { token: chefToken });
  check('удаление своего комментария → 204', removeComment.status === 204);

  const follow = await api('POST', `/users/${chefId}/follow`, { token: readerToken });
  check('POST /users/:id/follow → 204', follow.status === 204, follow.body);
  const followAgain = await api('POST', `/users/${chefId}/follow`, { token: readerToken });
  check('повторная подписка → 409', followAgain.status === 409);
  const selfFollow = await api('POST', `/users/${readerId}/follow`, { token: readerToken });
  check('подписка на себя → 400', selfFollow.status === 400, selfFollow.body);
  const followers = await api('GET', `/users/${chefId}/followers`);
  check('GET /users/:id/followers содержит читателя', followers.body.data.some((u: any) => u.id === readerId));
  const feed = await api('GET', '/users/me/feed', { token: readerToken });
  check('GET /users/me/feed содержит рецепт автора', feed.body.data.some((r: any) => r.id === recipeId), feed.body?.meta);

  // ------------------------------------------------------------------- доступ
  section('8. Права доступа и ошибки');
  const foreignPatch = await api('PATCH', `/recipes/${recipeId}`, { token: readerToken, body: { title: 'Захват рецепта' } });
  check('изменение чужого рецепта → 403', foreignPatch.status === 403, foreignPatch.body);
  const foreignDelete = await api('DELETE', `/recipes/${recipeId}`, { token: readerToken });
  check('удаление чужого рецепта → 403', foreignDelete.status === 403);
  const missing = await api('GET', '/recipes/99999999');
  check('несуществующий рецепт → 404', missing.status === 404 && missing.body?.error?.code === 'NOT_FOUND');
  const badId = await api('GET', '/recipes/not-a-number');
  check('нечисловой id → 400', badId.status === 400, badId.body);
  const unknownRoute = await fetch(`${API}/unknown-route`);
  check('несуществующий маршрут → 404', unknownRoute.status === 404);

  section('9. Удаление');
  const removed = await api('DELETE', `/recipes/${emptyDraft.body.id}`, { token: chefToken });
  check('DELETE /recipes/:id → 204', removed.status === 204);
  const afterRemove = await api('GET', `/recipes/${emptyDraft.body.id}`, { token: chefToken });
  check('удалённый рецепт → 404', afterRemove.status === 404);

  console.log(`\n\x1b[1mИТОГО:\x1b[0m ${passed} успешно, ${failed} провалено`);
  if (failed) {
    console.log('Провалены:', failures.join('; '));
    process.exit(1);
  }
};

run().catch((error) => {
  console.error('Ошибка выполнения smoke-теста:', error);
  process.exit(1);
});
