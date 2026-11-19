import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = (process.argv[2] || 'http://127.0.0.1:18000').replace(/\/$/, '');
const nonce = randomUUID().slice(0, 8);
const email = `smoke-${nonce}@example.test`;
const password = randomUUID();
const title = `Smoke recipe ${nonce}`;
let token;
let user;
let recipe;
let comment;

async function request(path, { method = 'GET', body, status = 200 } = {}) {
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    const response = await fetch(base + path, {
        method, headers, body: body && JSON.stringify(body), signal: AbortSignal.timeout(10000),
    });
    assert.equal(response.status, status, `${method} ${path}`);
    return response.json();
}

try {
    assert.equal((await request('/health')).status, 'ok');
    assert.equal((await request('/ready')).status, 'ok');
    assert.equal((await request('/api/users/me', { status: 401 })).message.length > 0, true);

    const registration = await request('/api/auth/register', {
        method: 'POST',
        body: { email, password, username: `smoke-${nonce}`, firstName: 'Smoke', lastName: 'Test' },
    });
    token = registration.accessToken;
    user = registration.user;
    assert.ok(token && user.id);
    const login = await request('/api/auth/login', { method: 'POST', body: { email, password } });
    assert.ok(login.accessToken);
    const profile = await request('/api/users/me');
    assert.equal(profile.id, user.id);
    assert.ok(!('password' in profile));
    console.log('Auth: registration, login and JWT profile passed');

    recipe = await request('/api/recipes/', {
        method: 'POST',
        body: { title, description: 'Smoke test', difficulty: 'easy', cookingTime: 15, servings: 2, authorId: user.id },
    });
    assert.ok(recipe.id);
    assert.equal((await request(`/api/recipes/details?id=${recipe.id}`)).title, title);
    assert.ok((await request(`/api/recipes/?query=${encodeURIComponent(nonce)}`)).some(item => item.id === recipe.id));
    console.log('Recipe: create, details and filter passed');

    const commentsPath = `/api/comments/?recipeId=${recipe.id}`;
    comment = await request('/api/comments/', {
        method: 'POST', body: { recipeId: recipe.id, text: 'Smoke comment' },
    });
    assert.ok(comment.id);
    assert.ok((await request(commentsPath)).some(item => item.id === comment.id));
    console.log('Social: create and read comment passed');
} finally {
    if (comment?.id) await request(`/api/comments/delete?id=${comment.id}`, { method: 'DELETE' });
    if (recipe?.id) await request(`/api/recipes/delete?id=${recipe.id}`, { method: 'DELETE' });
    if (user?.id) await request(`/api/users/delete?id=${user.id}`, { method: 'DELETE' });
}
