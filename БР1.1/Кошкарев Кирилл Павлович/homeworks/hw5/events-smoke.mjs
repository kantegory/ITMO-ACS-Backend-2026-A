/**
 * ДЗ5. Проверка межсервисного взаимодействия через RabbitMQ.
 *
 * Сценарий проверяет весь цикл событий:
 *   user.registered / recipe.published → проекции social-service;
 *   social.recipe.liked / social.comment.* → счётчики recipe-service;
 *   recipe.updated → обновление проекции;
 *   recipe.deleted → каскадная очистка данных в social-service.
 *
 * Запуск (стек поднят через docker compose в ЛР3):
 *   GATEWAY_URL=http://localhost:8080 node events-smoke.mjs
 */
const GATEWAY = process.env.GATEWAY_URL ?? 'http://localhost:3000';
const SOCIAL = process.env.SOCIAL_SERVICE_URL ?? null; // не обязателен: состояние берём из /health шлюза

let passed = 0;
let failed = 0;
const failures = [];

const check = (name, condition, extra) => {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${extra !== undefined ? ` → ${JSON.stringify(extra).slice(0, 240)}` : ''}`);
  }
};
const section = (title) => console.log(`\n\x1b[1m${title}\x1b[0m`);

const api = async (method, path, { token, body } = {}) => {
  const response = await fetch(`${GATEWAY}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: response.status, body: parsed };
};

const projections = async () => {
  const health = await api('GET', '/health');
  return health.body?.services?.['social-service']?.projections ?? { recipes: 0, users: 0 };
};

/** Ждёт выполнения условия: события доставляются асинхронно. */
const waitFor = async (predicate, { timeoutMs = 8000, stepMs = 250 } = {}) => {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await predicate();
    if (last) return last;
    await new Promise((resolve) => setTimeout(resolve, stepMs));
  }
  return last ?? false;
};

const unique = Date.now().toString(36);

const run = async () => {
  console.log(`\x1b[1mEVENTS: RabbitMQ-взаимодействие @ ${GATEWAY}\x1b[0m`);

  section('1. Брокер подключён во всех сервисах');
  const health = await api('GET', '/health');
  const services = health.body?.services ?? {};
  check('user-service подключён к брокеру', services['user-service']?.broker === 'connected', services['user-service']);
  check('recipe-service подключён к брокеру', services['recipe-service']?.broker === 'connected', services['recipe-service']);
  check('social-service подключён к брокеру', services['social-service']?.broker === 'connected', services['social-service']);

  const before = await projections();
  console.log(`  ↳ проекции до сценария: рецептов ${before.recipes}, пользователей ${before.users}`);

  section('2. user.registered → проекция пользователей social-service');
  const username = `events_${unique}`;
  const register = await api('POST', '/api/v1/auth/register', {
    body: { email: `${username}@lecters.recipes`, username, password: 'Chianti2026!', fullName: 'Гость событийный' },
  });
  check('регистрация прошла', register.status === 201, register.body);
  const token = register.body.accessToken;
  const userId = register.body.user.id;

  // Проверяем содержимое проекции, а не число строк: счётчик ненадёжен, если базы
  // сервисов пересевали по отдельности и идентификаторы начались заново.
  // Имя автора в комментарии social-service берёт ИСКЛЮЧИТЕЛЬНО из user_projection,
  // а при её отсутствии подставляет заглушку user<id> — значит совпадение имени
  // доказывает, что событие user.registered дошло и было применено.
  const seeded = (await api('GET', '/api/v1/recipes?limit=1')).body.data[0];
  const probe = await api('POST', `/api/v1/recipes/${seeded.id}/comments`, {
    token, body: { body: 'Проверка проекции пользователей.' },
  });
  check('комментарий от нового пользователя создан', probe.status === 201, probe.body);
  const projected = await waitFor(async () => {
    const fresh = await api('GET', `/api/v1/recipes/${seeded.id}/comments?limit=50`);
    const mine = fresh.body.data.find((c) => c.id === probe.body.id);
    return mine && mine.author?.username === username ? mine : false;
  });
  check('social-service применил user.registered: имя автора взято из проекции',
    Boolean(projected), projected || 'имя осталось заглушкой user<id>');
  await api('DELETE', `/api/v1/comments/${probe.body.id}`, { token });

  section('3. recipe.published → проекция рецептов');
  const ingredients = await api('GET', '/api/v1/ingredients?limit=100');
  const oil = ingredients.body.data.find((i) => i.name === 'Оливковое масло') ?? ingredients.body.data[0];
  const created = await api('POST', '/api/v1/recipes', {
    token,
    body: {
      title: `Тартар событийный ${unique}`,
      summary: 'Рецепт для проверки обмена событиями.',
      difficulty: 'medium', prepTimeMinutes: 20, cookTimeMinutes: 0, servings: 2,
      ingredients: [{ ingredientId: oil.id, quantity: 15, unit: 'мл' }],
      steps: [{ stepNumber: 1, instruction: 'Нарезать вырезку мелким кубиком и приправить.', durationMinutes: 15 }],
    },
  });
  check('черновик создан', created.status === 201, created.body);
  const recipeId = created.body.id;

  const publish = await api('POST', `/api/v1/recipes/${recipeId}/publish`, { token });
  check('рецепт опубликован', publish.status === 200 && publish.body.status === 'published');
  // Наличие проекции рецепта доказывается в разделе 6: её удаление по событию
  // recipe.deleted уменьшает счётчик, а уменьшиться может только существовавшая запись.
  console.log(`  ↳ проекции после публикации: ${JSON.stringify(await projections())}`);

  section('4. social.recipe.liked → счётчик лайков в recipe-service');
  const like = await api('POST', `/api/v1/recipes/${recipeId}/like`, { token });
  check('лайк поставлен', like.status === 200 && like.body.liked === true, like.body);
  // счётчик в БД recipe-service обновляется ТОЛЬКО событием, а не прямым вызовом
  const likeCounted = await waitFor(async () => {
    const fresh = await api('GET', `/api/v1/recipes/${recipeId}`, { token });
    return fresh.body?.likesCount >= 1 ? fresh.body : false;
  });
  check('recipe-service увеличил likesCount по событию', Boolean(likeCounted), likeCounted && { likesCount: likeCounted.likesCount });

  const unlike = await api('DELETE', `/api/v1/recipes/${recipeId}/like`, { token });
  check('лайк снят', unlike.body?.liked === false);
  const unlikeCounted = await waitFor(async () => {
    const fresh = await api('GET', `/api/v1/recipes/${recipeId}`, { token });
    return fresh.body?.likesCount === 0 ? fresh.body : false;
  });
  check('recipe-service уменьшил likesCount по событию', Boolean(unlikeCounted));

  section('5. social.comment.* → счётчик комментариев');
  const comment = await api('POST', `/api/v1/recipes/${recipeId}/comments`, {
    token, body: { body: 'Проверка событийного счётчика комментариев.' },
  });
  check('комментарий создан', comment.status === 201, comment.body);
  const commentCounted = await waitFor(async () => {
    const fresh = await api('GET', `/api/v1/recipes/${recipeId}`, { token });
    return fresh.body?.commentsCount >= 1 ? fresh.body : false;
  });
  check('recipe-service увеличил commentsCount по событию', Boolean(commentCounted));

  const removeComment = await api('DELETE', `/api/v1/comments/${comment.body.id}`, { token });
  check('комментарий удалён', removeComment.status === 204);
  const commentDecremented = await waitFor(async () => {
    const fresh = await api('GET', `/api/v1/recipes/${recipeId}`, { token });
    return fresh.body?.commentsCount === 0 ? fresh.body : false;
  });
  check('recipe-service уменьшил commentsCount по событию', Boolean(commentDecremented));

  section('6. recipe.deleted → каскадная очистка в social-service');
  await api('POST', `/api/v1/recipes/${recipeId}/favorite`, { token });
  const favoritesBefore = await api('GET', '/api/v1/users/me/favorites', { token });
  check('рецепт сохранён в избранное', favoritesBefore.body.data.some((r) => r.id === recipeId));

  const beforeDelete = await projections();
  const removed = await api('DELETE', `/api/v1/recipes/${recipeId}`, { token });
  check('рецепт удалён', removed.status === 204);

  const projectionShrank = await waitFor(async () => (await projections()).recipes < beforeDelete.recipes);
  check('проекция рецепта существовала (recipe.published) и удалена (recipe.deleted)',
    Boolean(projectionShrank), await projections());

  const favoritesCleared = await waitFor(async () => {
    const fresh = await api('GET', '/api/v1/users/me/favorites', { token });
    return fresh.body.data.every((r) => r.id !== recipeId);
  });
  check('избранное очищено без межбазовых внешних ключей', Boolean(favoritesCleared));

  section('7. Идемпотентность и устойчивость');
  const doubleLikeRecipe = (await api('GET', '/api/v1/recipes?limit=1')).body.data[0];
  // счётчик проверяем относительно текущего значения: рецепт мог собрать лайки раньше
  const likesBefore = doubleLikeRecipe.likesCount;
  const first = await api('POST', `/api/v1/recipes/${doubleLikeRecipe.id}/like`, { token });
  const second = await api('POST', `/api/v1/recipes/${doubleLikeRecipe.id}/like`, { token });
  check('повторный лайк не публикует второе событие', first.body.likesCount === second.body.likesCount,
    { first: first.body.likesCount, second: second.body.likesCount });
  const stable = await waitFor(async () => {
    const fresh = await api('GET', `/api/v1/recipes/${doubleLikeRecipe.id}`, { token });
    return fresh.body.likesCount === likesBefore + 1 ? fresh.body : false;
  });
  check(`счётчик рецепта вырос ровно на 1 (было ${likesBefore})`, Boolean(stable),
    stable ? { likesCount: stable.likesCount } : { ожидалось: likesBefore + 1 });
  await api('DELETE', `/api/v1/recipes/${doubleLikeRecipe.id}/like`, { token });

  console.log(`\n\x1b[1mИТОГО:\x1b[0m ${passed} успешно, ${failed} провалено`);
  if (failed) {
    console.log('Провалены:', failures.join('; '));
    process.exit(1);
  }
};

run().catch((error) => { console.error('Ошибка сценария:', error); process.exit(1); });
