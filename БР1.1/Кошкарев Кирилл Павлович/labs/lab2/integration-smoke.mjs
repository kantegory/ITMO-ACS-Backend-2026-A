/**
 * Интеграционный сценарий микросервисной версии «Lecter's Recipes» (ЛР2).
 * Проверяет маршрутизацию через gateway, агрегацию данных трёх сервисов
 * и изоляцию баз (database-per-service).
 *
 * Запуск (все сервисы должны быть подняты):
 *   node integration-smoke.mjs
 */
const GATEWAY = process.env.GATEWAY_URL ?? 'http://localhost:3000';
const USER_SVC = process.env.USER_SERVICE_URL ?? 'http://localhost:3001';
const RECIPE_SVC = process.env.RECIPE_SERVICE_URL ?? 'http://localhost:3002';
const SOCIAL_SVC = process.env.SOCIAL_SERVICE_URL ?? 'http://localhost:3003';
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN ?? 'lecters-internal-token';

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

const check = (name, condition, extra) => {
  if (condition) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  \x1b[31m✗\x1b[0m ${name}${extra !== undefined ? ` → ${JSON.stringify(extra).slice(0, 260)}` : ''}`);
  }
};
const skip = (name, reason) => {
  skipped += 1;
  console.log(`  \x1b[33m•\x1b[0m ${name} — пропущено: ${reason}`);
};
const section = (title) => console.log(`\n\x1b[1m${title}\x1b[0m`);

/** Доступен ли сервис напрямую. В контуре docker compose наружу опубликован
 *  только шлюз, поэтому проверки внутренних эндпоинтов там выполнить нельзя. */
const reachable = async (base) => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(`${base}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
};

const api = async (method, path, { token, body, base = GATEWAY, headers = {} } = {}) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: response.status, body: parsed };
};

const unique = Date.now().toString(36);

const run = async () => {
  console.log(`\x1b[1mINTEGRATION: микросервисы Lecter's Recipes @ ${GATEWAY}\x1b[0m`);

  section('1. Здоровье контура');
  const health = await api('GET', '/health');
  check('gateway опрашивает все сервисы', health.status === 200 && health.body.status === 'ok', health.body);
  check('user-service жив', health.body?.services?.['user-service']?.status === 'ok');
  check('recipe-service жив', health.body?.services?.['recipe-service']?.status === 'ok');
  check('social-service жив', health.body?.services?.['social-service']?.status === 'ok');

  // В контуре docker compose наружу опубликован только шлюз: часть проверок,
  // обращающихся к сервисам напрямую, в этом режиме пропускается.
  const directAccess = USER_SVC !== GATEWAY && (await reachable(USER_SVC))
    && (await reachable(SOCIAL_SVC));
  if (!directAccess) {
    console.log('  ↳ сервисы напрямую недоступны — режим «только через шлюз»');
  }

  section('2. Аутентификация через gateway (проксирование в user-service)');
  const email = `chef_${unique}@lecters.recipes`;
  const register = await api('POST', '/api/v1/auth/register', {
    body: { email, username: `chef_${unique}`, password: 'Chianti2026!', fullName: 'Шеф Интеграционный' },
  });
  check('POST /auth/register через gateway → 201', register.status === 201, register.body);
  const token = register.body?.accessToken;
  const userId = register.body?.user?.id;
  check('выдан JWT', typeof token === 'string');

  const login = await api('POST', '/api/v1/auth/login', { body: { email, password: 'Chianti2026!' } });
  check('POST /auth/login → 200', login.status === 200);

  section('3. Один токен принимается всеми сервисами (общий секрет)');
  const meViaGateway = await api('GET', '/api/v1/users/me', { token });
  check('gateway → user-service /users/me', meViaGateway.status === 200 && meViaGateway.body.email === email);
  if (directAccess) {
    const directSocial = await api('GET', '/api/v1/users/me/favorites', { token, base: SOCIAL_SVC });
    check('тот же токен принят social-service напрямую', directSocial.status === 200, directSocial.body);
  } else {
    const viaGateway = await api('GET', '/api/v1/users/me/favorites', { token });
    check('тот же токен принят social-service (через шлюз)', viaGateway.status === 200, viaGateway.body);
  }

  section('4. Витрина: агрегация recipe + user + social');
  const list = await api('GET', '/api/v1/recipes?limit=5', { token });
  check('GET /recipes → 200', list.status === 200, list.body);
  check('список не пуст', list.body?.data?.length > 0);
  const card = list.body.data[0];
  check('gateway подставил автора из user-service', Boolean(card?.author?.username), card?.author);
  check('gateway подставил состояние реакций из social-service',
    card?.isLiked === false && typeof card?.likesCount === 'number', {
      isLiked: card?.isLiked, likesCount: card?.likesCount,
    });

  const recipeId = card.id;
  const authorId = card.author.id;

  const detail = await api('GET', `/api/v1/recipes/${recipeId}`, { token });
  check('GET /recipes/:id → 200 с составом и шагами',
    detail.status === 200 && detail.body.ingredients.length > 0 && detail.body.steps.length > 0);
  check('карточка рецепта содержит автора', Boolean(detail.body?.author?.username));

  section('5. Фильтрация (recipe-service)');
  const filtered = await api('GET', '/api/v1/recipes?difficulty=hard&maxCookTime=180');
  check('фильтр difficulty+maxCookTime работает через gateway',
    filtered.status === 200 && filtered.body.data.every((r) => r.difficulty === 'hard' && r.cookTimeMinutes <= 180));

  section('6. Социальные действия (social-service)');
  const like = await api('POST', `/api/v1/recipes/${recipeId}/like`, { token });
  check('POST /recipes/:id/like → liked=true', like.status === 200 && like.body.liked === true, like.body);
  const afterLike = await api('GET', `/api/v1/recipes/${recipeId}`, { token });
  check('состояние лайка видно в агрегированной карточке', afterLike.body.isLiked === true);
  check('счётчик лайков пришёл из social-service', afterLike.body.likesCount >= 1);

  const favorite = await api('POST', `/api/v1/recipes/${recipeId}/favorite`, { token });
  check('POST /recipes/:id/favorite → favorite=true', favorite.body?.favorite === true, favorite.body);
  const favorites = await api('GET', '/api/v1/users/me/favorites', { token });
  check('GET /users/me/favorites собирает карточки из recipe-service',
    favorites.status === 200 && favorites.body.data.some((r) => r.id === recipeId), favorites.body);
  check('в сохранённом тоже есть автор', Boolean(favorites.body.data[0]?.author?.username));

  const comment = await api('POST', `/api/v1/recipes/${recipeId}/comments`, {
    token, body: { body: 'Проверка межсервисного сценария: подаём с кьянти.' },
  });
  check('POST комментария → 201', comment.status === 201, comment.body);
  const comments = await api('GET', `/api/v1/recipes/${recipeId}/comments`);
  check('комментарий виден в ленте', comments.body.data.some((c) => c.id === comment.body.id));

  section('7. Подписки и лента (user-service + recipe-service)');
  const follow = await api('POST', `/api/v1/users/${authorId}/follow`, { token });
  check('POST /users/:id/follow → 204', follow.status === 204, follow.body);
  const feed = await api('GET', '/api/v1/users/me/feed', { token });
  check('лента собрана из публикаций автора',
    feed.status === 200 && feed.body.data.length > 0 && feed.body.data.every((r) => r.author.id === authorId),
    feed.body?.meta);

  section('8. Публикация собственного рецепта через gateway');
  const ingredients = await api('GET', '/api/v1/ingredients?limit=100');
  const oil = ingredients.body.data.find((i) => i.name === 'Оливковое масло') ?? ingredients.body.data[0];
  const created = await api('POST', '/api/v1/recipes', {
    token,
    body: {
      title: `Карпаччо интеграционное ${unique}`,
      summary: 'Проверка сквозного создания рецепта.',
      difficulty: 'medium',
      cookTimeMinutes: 0,
      prepTimeMinutes: 25,
      servings: 2,
      tags: ['быстро'],
      ingredients: [{ ingredientId: oil.id, quantity: 20, unit: 'мл' }],
      steps: [{ stepNumber: 1, instruction: 'Нарезать вырезку тончайшими ломтиками.', durationMinutes: 15 }],
    },
  });
  check('POST /recipes → 201 (черновик)', created.status === 201 && created.body.status === 'draft', created.body);
  const published = await api('POST', `/api/v1/recipes/${created.body.id}/publish`, { token });
  check('POST /recipes/:id/publish → published', published.status === 200 && published.body.status === 'published');
  const mine = await api('GET', `/api/v1/users/${userId}/recipes`, { token });
  check('рецепт виден в публикациях автора', mine.body.data.some((r) => r.id === created.body.id));

  section('9. Внутренние эндпоинты и их защита');
  if (!directAccess) {
    skip('проверки /internal', 'сервисы не опубликованы наружу (контур docker compose)');
    skip('internal/recipes и internal/social', 'доступны только внутри сети контура');
  }
  const noToken = directAccess
    ? await api('GET', `/internal/users?ids=${authorId}`, { base: USER_SVC })
    : null;
  if (directAccess) {
    check('internal без X-Internal-Token → 401', noToken.status === 401, noToken.body);
    const withToken = await api('GET', `/internal/users?ids=${authorId}`, {
      base: USER_SVC, headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    });
    check('internal с токеном → профиль', withToken.status === 200 && withToken.body.data.length === 1, withToken.body);
    const internalRecipes = await api('GET', `/internal/recipes?ids=${recipeId}`, {
      base: RECIPE_SVC, headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    });
    check('internal/recipes отдаёт карточку без автора',
      internalRecipes.status === 200 && internalRecipes.body.data[0].authorId !== undefined
        && internalRecipes.body.data[0].author === undefined);
    const internalSocial = await api('GET', `/internal/social/recipes?ids=${recipeId}&userId=${userId}`, {
      base: SOCIAL_SVC, headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    });
    check('internal/social отдаёт счётчики и состояние зрителя',
      internalSocial.status === 200 && internalSocial.body.data[0].liked === true, internalSocial.body);
  }
  const internalViaGateway = await fetch(`${GATEWAY}/internal/users?ids=1`);
  check('gateway не публикует /internal наружу', internalViaGateway.status === 404);

  section('10. Изоляция баз данных');
  const socialBase = directAccess ? SOCIAL_SVC : GATEWAY;
  const socialDirect = await api('GET', `/api/v1/recipes/${recipeId}/comments`, { base: socialBase });
  check('social-service знает о рецепте без общей БД (проекция/синхронный вызов)',
    socialDirect.status === 200, socialDirect.body);
  const ghostLike = await api('POST', '/api/v1/recipes/99999999/like', { token, base: socialBase });
  check('лайк несуществующего рецепта → 404 (проверка через recipe-service)',
    ghostLike.status === 404, ghostLike.body);

  section('11. Права доступа сохраняются в распределённом контуре');
  const foreignPatch = await api('PATCH', `/api/v1/recipes/${recipeId}`, {
    token, body: { title: 'Захват чужого рецепта' },
  });
  check('изменение чужого рецепта → 403', foreignPatch.status === 403, foreignPatch.body);
  const anonymous = await api('GET', '/api/v1/users/me');
  check('без токена /users/me → 401', anonymous.status === 401);

  const skippedNote = skipped ? `, ${skipped} пропущено` : '';
  console.log(`\n\x1b[1mИТОГО:\x1b[0m ${passed} успешно, ${failed} провалено${skippedNote}`);
  if (failed) {
    console.log('Провалены:', failures.join('; '));
    process.exit(1);
  }
};

run().catch((error) => { console.error('Ошибка сценария:', error); process.exit(1); });
