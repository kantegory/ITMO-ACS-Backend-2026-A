/* Lecter's Recipes — витрина поверх REST API. Ванильный JS, без сборки. */
(() => {
  const API = '/api/v1';
  const state = {
    token: localStorage.getItem('lr_token') || null,
    user: JSON.parse(localStorage.getItem('lr_user') || 'null'),
    dictionaries: { categories: [], cuisines: [], ingredients: [] },
    view: 'catalog',
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const esc = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (ch) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const DIFFICULTY = { easy: 'простая', medium: 'средняя', hard: 'сложная' };

  /** Аватар автора; если его нет — монограмма из первой буквы имени. */
  const avatarHtml = (author, size = 28) => {
    if (!author) return '';
    const style = `width:${size}px;height:${size}px`;
    return author.avatarUrl
      ? `<img class="avatar" style="${style}" src="${esc(author.avatarUrl)}" alt="">`
      : `<span class="avatar avatar-fallback" style="${style};line-height:${size}px">${
          esc((author.username || '?').charAt(0).toUpperCase())}</span>`;
  };

  let toastTimer;
  const toast = (message, isError = false) => {
    const el = $('#toast');
    el.textContent = message;
    el.classList.toggle('error', isError);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  };

  /** Единая точка вызова API: подставляет токен и разворачивает ошибки сервера. */
  const api = async (method, path, body) => {
    const response = await fetch(API + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.error?.message || `Ошибка ${response.status}`);
      error.code = data?.error?.code;
      error.details = data?.error?.details;
      throw error;
    }
    return data;
  };

  // ------------------------------------------------------------------ сессия
  const setSession = (token, user) => {
    state.token = token;
    state.user = user;
    if (token) {
      localStorage.setItem('lr_token', token);
      localStorage.setItem('lr_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lr_token');
      localStorage.removeItem('lr_user');
    }
    renderSession();
  };

  const renderSession = () => {
    const box = $('#session');
    if (state.user) {
      box.innerHTML = `<span>за столом: <b style="color:var(--gold)">${esc(state.user.username)}</b></span>
        <button class="btn btn-ghost" id="do-logout">выйти</button>`;
      $('#do-logout').onclick = () => { setSession(null, null); toast('Сеанс завершён'); showView('catalog'); };
    } else {
      box.innerHTML = '<span>гость</span>';
    }
    $('#auth-panel').hidden = Boolean(state.user);
    $('#profile-panel').hidden = !state.user;
  };

  // ------------------------------------------------------------- отрисовка
  const cardHtml = (recipe) => {
    const cover = recipe.coverImageUrl
      ? `style="background-image:url('${esc(recipe.coverImageUrl)}')"`
      : '';
    const label = recipe.coverImageUrl ? '' : 'LECTER&rsquo;S';
    return `
      <article class="card" data-id="${recipe.id}">
        <div class="cover" ${cover}>${label}</div>
        <div class="body">
          <h3>${esc(recipe.title)}</h3>
          <div class="meta">
            <span>${DIFFICULTY[recipe.difficulty] || recipe.difficulty}</span>
            <span>${recipe.cookTimeMinutes} мин</span>
            <span>${recipe.servings} порц.</span>
          </div>
          <div class="summary">${esc(recipe.summary || '')}</div>
          <div class="foot">
            <span class="byline-mini">${avatarHtml(recipe.author, 22)}${esc(recipe.author?.username || '')}</span>
            <span>♥ ${recipe.likesCount} &nbsp; ✎ ${recipe.commentsCount}</span>
          </div>
        </div>
      </article>`;
  };

  const renderGrid = (selector, recipes, emptyText) => {
    const grid = $(selector);
    if (!recipes.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(emptyText)}</div>`;
      return;
    }
    grid.innerHTML = recipes.map(cardHtml).join('');
    grid.querySelectorAll('.card').forEach((card) => {
      card.onclick = () => openRecipe(card.dataset.id);
    });
  };

  // --------------------------------------------------------------- витрина
  const buildQuery = () => {
    const params = new URLSearchParams();
    const q = $('#f-q').value.trim();
    if (q) params.set('q', q);
    if ($('#f-category').value) params.set('categoryId', $('#f-category').value);
    if ($('#f-cuisine').value) params.set('cuisineId', $('#f-cuisine').value);
    if ($('#f-difficulty').value) params.set('difficulty', $('#f-difficulty').value);
    if ($('#f-time').value) params.set('maxCookTime', $('#f-time').value);
    if ($('#f-ingredient').value) params.set('ingredientId', $('#f-ingredient').value);
    params.set('sort', $('#f-sort').value);
    params.set('limit', '12');
    return params.toString();
  };

  const loadCatalog = async () => {
    try {
      const result = await api('GET', `/recipes?${buildQuery()}`);
      renderGrid('#catalog-grid', result.data, 'По заданным условиям ничего не найдено.');
      $('#catalog-meta').textContent =
        `найдено ${result.meta.total} · страница ${result.meta.page} из ${result.meta.totalPages}`;
    } catch (error) {
      toast(error.message, true);
    }
  };

  const loadDictionaries = async () => {
    const [categories, cuisines, ingredients] = await Promise.all([
      api('GET', '/categories'),
      api('GET', '/cuisines'),
      api('GET', '/ingredients?limit=100'),
    ]);
    state.dictionaries = {
      categories: categories.data,
      cuisines: cuisines.data,
      ingredients: ingredients.data,
    };
    const fill = (sel, items, placeholder) => {
      $(sel).innerHTML =
        `<option value="">${placeholder}</option>` +
        items.map((item) => `<option value="${item.id}">${esc(item.name)}</option>`).join('');
    };
    fill('#f-category', categories.data, 'любой');
    fill('#f-cuisine', cuisines.data, 'любая');
    fill('#f-ingredient', ingredients.data, 'любой');
    fill('#e-category', categories.data, '— не выбрано —');
    fill('#e-cuisine', cuisines.data, '— не выбрано —');
  };

  // ------------------------------------------------------- карточка рецепта
  const commentHtml = (comment) => `
    <div class="comment ${comment.parentId ? 'reply' : ''}">
      <div>${avatarHtml(comment.author, 22)}<span class="who">${esc(comment.author?.username || 'гость')}</span>
        <span class="when">${new Date(comment.createdAt).toLocaleString('ru-RU')}</span></div>
      <div>${esc(comment.body)}</div>
    </div>`;

  const openRecipe = async (id) => {
    try {
      const [recipe, comments] = await Promise.all([
        api('GET', `/recipes/${id}`),
        api('GET', `/recipes/${id}/comments?limit=50`),
      ]);
      const sheet = $('#recipe-sheet');
      sheet.innerHTML = `
        <div class="sheet-head">
          <div>
            <h2>${esc(recipe.title)}</h2>
            <div class="byline">${avatarHtml(recipe.author, 30)}${esc(recipe.author?.fullName || recipe.author?.username || '')}
              ${recipe.cuisine ? ' · ' + esc(recipe.cuisine.name) + ' кухня' : ''}
              ${recipe.category ? ' · ' + esc(recipe.category.name) : ''}</div>
          </div>
          <button class="btn btn-ghost" id="sheet-close">закрыть</button>
        </div>
        <div class="stat-row">
          <span>сложность <b>${DIFFICULTY[recipe.difficulty] || recipe.difficulty}</b></span>
          <span>подготовка <b>${recipe.prepTimeMinutes} мин</b></span>
          <span>готовка <b>${recipe.cookTimeMinutes} мин</b></span>
          <span>порций <b>${recipe.servings}</b></span>
          ${recipe.calories ? `<span>ккал <b>${recipe.calories}</b></span>` : ''}
        </div>
        <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
          ${(recipe.tags || []).map((tag) => `<span class="chip">${esc(tag.name)}</span>`).join('')}
          ${recipe.status !== 'published' ? '<span class="chip wine">черновик</span>' : ''}
        </div>
        ${recipe.description ? `<p style="color:var(--muted); margin-top:18px">${esc(recipe.description)}</p>` : ''}

        <div style="margin-top:22px; display:flex; gap:12px;">
          <button class="btn ${recipe.isLiked ? 'is-on' : ''}" id="btn-like">♥ ${recipe.likesCount}</button>
          <button class="btn ${recipe.isFavorite ? 'is-on' : ''}" id="btn-fav">
            ${recipe.isFavorite ? 'сохранено' : 'сохранить'}</button>
          ${recipe.author && state.user && recipe.author.id === state.user.id && recipe.status !== 'published'
            ? '<button class="btn btn-primary" id="btn-publish">опубликовать</button>' : ''}
        </div>

        <h4>Состав</h4>
        <ul class="ingredients">
          ${(recipe.ingredients || []).map((item) => `
            <li><span>${esc(item.ingredient?.name || '')}${item.note ? ` <i style="color:var(--dim)">— ${esc(item.note)}</i>` : ''}</span>
                <span>${item.quantity} ${esc(item.unit)}</span></li>`).join('')
            || '<li><span style="color:var(--dim)">состав не указан</span><span></span></li>'}
        </ul>

        <h4>Приготовление</h4>
        <ol class="steps">
          ${(recipe.steps || []).map((step) => `
            <li>${esc(step.instruction)}
              ${step.durationMinutes ? `<div style="color:var(--dim); font-size:13px">≈ ${step.durationMinutes} мин</div>` : ''}
            </li>`).join('') || '<li>шаги не указаны</li>'}
        </ol>

        ${recipe.media?.length ? `<h4>Галерея</h4><div class="gallery">
          ${recipe.media.map((m) => `<img src="${esc(m.url)}" alt="${esc(m.caption || '')}">`).join('')}
        </div>` : ''}

        <h4>Обсуждение</h4>
        <div id="comments">${comments.data.map(commentHtml).join('') ||
          '<div style="color:var(--dim)">Пока тихо. Скажите первое слово.</div>'}</div>
        ${state.user ? `
          <div class="form-row" style="margin-top:16px">
            <textarea id="comment-body" rows="2" placeholder="Ваш комментарий…"></textarea>
          </div>
          <button class="btn" id="send-comment">Отправить</button>` :
          '<p class="hint">Войдите, чтобы оставить комментарий.</p>'}
      `;
      $('#recipe-overlay').hidden = false;
      $('#sheet-close').onclick = () => { $('#recipe-overlay').hidden = true; };

      $('#btn-like').onclick = async () => {
        if (!state.user) return toast('Нужно войти', true);
        try {
          const result = await api(recipe.isLiked ? 'DELETE' : 'POST', `/recipes/${id}/like`);
          recipe.isLiked = result.liked;
          recipe.likesCount = result.likesCount;
          $('#btn-like').textContent = `♥ ${result.likesCount}`;
          $('#btn-like').classList.toggle('is-on', result.liked);
        } catch (error) { toast(error.message, true); }
      };
      $('#btn-fav').onclick = async () => {
        if (!state.user) return toast('Нужно войти', true);
        try {
          const result = await api(recipe.isFavorite ? 'DELETE' : 'POST', `/recipes/${id}/favorite`);
          recipe.isFavorite = result.favorite;
          $('#btn-fav').textContent = result.favorite ? 'сохранено' : 'сохранить';
          $('#btn-fav').classList.toggle('is-on', result.favorite);
        } catch (error) { toast(error.message, true); }
      };
      const publish = $('#btn-publish');
      if (publish) publish.onclick = async () => {
        try {
          await api('POST', `/recipes/${id}/publish`);
          toast('Рецепт опубликован');
          $('#recipe-overlay').hidden = true;
          refreshCurrentView();
        } catch (error) { toast(error.message, true); }
      };
      const send = $('#send-comment');
      if (send) send.onclick = async () => {
        const body = $('#comment-body').value.trim();
        if (!body) return;
        try {
          await api('POST', `/recipes/${id}/comments`, { body });
          $('#comment-body').value = '';
          const fresh = await api('GET', `/recipes/${id}/comments?limit=50`);
          $('#comments').innerHTML = fresh.data.map(commentHtml).join('');
          toast('Комментарий добавлен');
        } catch (error) { toast(error.message, true); }
      };
    } catch (error) {
      toast(error.message, true);
    }
  };

  $('#recipe-overlay').onclick = (event) => {
    if (event.target.id === 'recipe-overlay') $('#recipe-overlay').hidden = true;
  };

  // ------------------------------------------------------------ переключение
  const showView = async (name) => {
    state.view = name;
    $$('.nav button').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === name));
    ['catalog', 'feed', 'favorites', 'mine', 'account'].forEach((view) => {
      $(`#view-${view}`).hidden = view !== name;
    });
    await refreshCurrentView();
  };

  const refreshCurrentView = async () => {
    try {
      if (state.view === 'catalog') return loadCatalog();
      if (state.view === 'feed') {
        if (!state.user) return renderGrid('#feed-grid', [], 'Войдите, чтобы видеть ленту подписок.');
        const result = await api('GET', '/users/me/feed?limit=12');
        return renderGrid('#feed-grid', result.data, 'Подпишитесь на кулинаров — здесь появятся их публикации.');
      }
      if (state.view === 'favorites') {
        if (!state.user) return renderGrid('#favorites-grid', [], 'Войдите, чтобы видеть сохранённое.');
        const result = await api('GET', '/users/me/favorites?limit=12');
        return renderGrid('#favorites-grid', result.data, 'Пока ничего не сохранено.');
      }
      if (state.view === 'mine') {
        if (!state.user) return renderGrid('#mine-grid', [], 'Войдите, чтобы увидеть свои публикации.');
        const result = await api('GET', `/users/${state.user.id}/recipes?limit=12`);
        return renderGrid('#mine-grid', result.data, 'У вас пока нет публикаций.');
      }
      if (state.view === 'account' && state.user) return loadProfile();
    } catch (error) {
      toast(error.message, true);
    }
  };

  const loadProfile = async () => {
    const me = await api('GET', '/users/me');
    setSession(state.token, me);
    $('#profile-body').innerHTML = `
      <div class="stat-row">
        <span>публикаций <b>${me.recipesCount}</b></span>
        <span>подписчиков <b>${me.followersCount}</b></span>
        <span>подписок <b>${me.followingCount}</b></span>
      </div>
      <p class="hint">${esc(me.email)} · роль: ${esc(me.role)} · в сервисе с
        ${new Date(me.createdAt).toLocaleDateString('ru-RU')}</p>`;
    $('#profile-bio').value = me.bio || '';
  };

  // ------------------------------------------------------------------ формы
  $('#do-login').onclick = async () => {
    try {
      const result = await api('POST', '/auth/login', {
        email: $('#login-email').value.trim(),
        password: $('#login-password').value,
      });
      setSession(result.accessToken, result.user);
      toast(`Добро пожаловать, ${result.user.username}`);
      showView('catalog');
    } catch (error) { toast(error.message, true); }
  };

  $('#do-register').onclick = async () => {
    try {
      const result = await api('POST', '/auth/register', {
        email: $('#reg-email').value.trim(),
        username: $('#reg-username').value.trim(),
        fullName: $('#reg-fullname').value.trim() || null,
        password: $('#reg-password').value,
      });
      setSession(result.accessToken, result.user);
      toast('Учётная запись создана');
      showView('catalog');
    } catch (error) {
      toast(error.details?.length ? `${error.message}: ${error.details[0].field} — ${error.details[0].message}` : error.message, true);
    }
  };

  $('#save-profile').onclick = async () => {
    try {
      await api('PATCH', '/users/me', { bio: $('#profile-bio').value });
      toast('Профиль обновлён');
      loadProfile();
    } catch (error) { toast(error.message, true); }
  };

  $('#f-apply').onclick = loadCatalog;
  $('#f-q').addEventListener('keydown', (event) => { if (event.key === 'Enter') loadCatalog(); });
  $('#f-reset').onclick = () => {
    ['#f-q', '#f-time'].forEach((sel) => { $(sel).value = ''; });
    ['#f-category', '#f-cuisine', '#f-difficulty', '#f-ingredient'].forEach((sel) => { $(sel).value = ''; });
    $('#f-sort').value = 'newest';
    loadCatalog();
  };

  $$('.nav button').forEach((btn) => { btn.onclick = () => showView(btn.dataset.view); });

  // -------------------------------------------------------- редактор рецепта
  const ingredientRow = () => {
    const options = state.dictionaries.ingredients
      .map((item) => `<option value="${item.id}">${esc(item.name)}</option>`).join('');
    const row = document.createElement('div');
    row.style.cssText = 'display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:10px; margin-bottom:8px;';
    row.innerHTML = `
      <select class="e-ing">${options}</select>
      <input class="e-qty" type="number" min="0.01" step="0.01" value="100" placeholder="кол-во">
      <input class="e-unit" type="text" value="г" placeholder="ед.">
      <button class="btn btn-ghost e-del">×</button>`;
    row.querySelector('.e-del').onclick = () => row.remove();
    return row;
  };

  const stepRow = () => {
    const row = document.createElement('div');
    row.style.cssText = 'display:grid; grid-template-columns:1fr 110px auto; gap:10px; margin-bottom:8px;';
    row.innerHTML = `
      <input class="e-instr" type="text" placeholder="Что делаем на этом шаге">
      <input class="e-dur" type="number" min="0" placeholder="мин">
      <button class="btn btn-ghost e-del">×</button>`;
    row.querySelector('.e-del').onclick = () => row.remove();
    return row;
  };

  $('#new-recipe').onclick = () => {
    if (!state.user) return toast('Войдите, чтобы публиковать рецепты', true);
    $('#e-ingredients').innerHTML = '';
    $('#e-steps').innerHTML = '';
    $('#e-ingredients').append(ingredientRow(), ingredientRow());
    $('#e-steps').append(stepRow(), stepRow());
    $('#editor-overlay').hidden = false;
  };
  $('#editor-close').onclick = () => { $('#editor-overlay').hidden = true; };
  $('#add-ingredient').onclick = () => $('#e-ingredients').append(ingredientRow());
  $('#add-step').onclick = () => $('#e-steps').append(stepRow());

  const collectRecipe = () => ({
    title: $('#e-title').value.trim(),
    summary: $('#e-summary').value.trim() || null,
    description: $('#e-description').value.trim() || null,
    categoryId: $('#e-category').value || null,
    cuisineId: $('#e-cuisine').value || null,
    difficulty: $('#e-difficulty').value,
    cookTimeMinutes: Number($('#e-cook').value) || 0,
    prepTimeMinutes: Number($('#e-prep').value) || 0,
    servings: Number($('#e-servings').value) || 1,
    tags: $('#e-tags').value.split(',').map((tag) => tag.trim()).filter(Boolean),
    ingredients: $$('#e-ingredients > div').map((row, index) => ({
      ingredientId: Number(row.querySelector('.e-ing').value),
      quantity: Number(row.querySelector('.e-qty').value),
      unit: row.querySelector('.e-unit').value || 'г',
      position: index,
    })).filter((item) => item.ingredientId && item.quantity > 0),
    steps: $$('#e-steps > div').map((row, index) => ({
      stepNumber: index + 1,
      instruction: row.querySelector('.e-instr').value.trim(),
      durationMinutes: Number(row.querySelector('.e-dur').value) || null,
    })).filter((item) => item.instruction.length >= 3),
  });

  const saveRecipe = async (publish) => {
    try {
      const created = await api('POST', '/recipes', collectRecipe());
      if (publish) await api('POST', `/recipes/${created.id}/publish`);
      toast(publish ? 'Рецепт опубликован' : 'Черновик сохранён');
      $('#editor-overlay').hidden = true;
      ['#e-title', '#e-summary', '#e-description', '#e-tags'].forEach((sel) => { $(sel).value = ''; });
      showView('mine');
    } catch (error) {
      toast(error.details?.length ? `${error.message}: ${error.details[0].field} — ${error.details[0].message}` : error.message, true);
    }
  };
  $('#save-recipe').onclick = () => saveRecipe(true);
  $('#save-draft').onclick = () => saveRecipe(false);

  // ------------------------------------------------------------------ старт
  (async () => {
    renderSession();
    try {
      await loadDictionaries();
    } catch (error) {
      toast('Не удалось загрузить справочники: ' + error.message, true);
    }
    await showView('catalog');
  })();
})();
