const baseUrl = process.env.GATEWAY_URL || 'http://127.0.0.1:8100/api/v1';
const suffix = Date.now();

const state = {
  adminToken: undefined,
  userToken: undefined,
  cuisineId: undefined,
  locationId: undefined,
  restaurantId: undefined,
  tableId: undefined,
  menuCategoryId: undefined,
  reservationId: undefined,
};

const request = async (method, path, body, token) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new Error(`${method} ${path} failed with ${response.status}: ${text}`);
  }

  return payload;
};

const step = async (title, fn) => {
  process.stdout.write(`- ${title}... `);
  await fn();
  console.log('ok');
};

await step('login admin', async () => {
  const result = await request('POST', '/auth/login', {
    email: 'admin@restaurant-booking.local',
    password: 'admin12345',
  });
  state.adminToken = result.data.tokens.accessToken;
});

await step('load cuisines', async () => {
  const result = await request('GET', '/reference/cuisines');
  state.cuisineId = result.data[0]?.id;
  if (!state.cuisineId) {
    throw new Error('No cuisine found');
  }
});

await step('create location', async () => {
  const result = await request('POST', '/admin/locations', {
    city: `Smoke City ${suffix}`,
    address: `Smoke street, ${suffix}`,
    district: 'Center',
    metroStation: 'Smoke',
  }, state.adminToken);
  state.locationId = result.data.id;
});

await step('create restaurant', async () => {
  const result = await request('POST', '/admin/restaurants', {
    locationId: state.locationId,
    priceCategory: 'MEDIUM',
    title: `Smoke Restaurant ${suffix}`,
    description: 'Microservices smoke-test restaurant',
    phone: '+79990001122',
    email: `restaurant${suffix}@example.com`,
    openTime: '10:00',
    closeTime: '23:00',
    cuisineIds: [state.cuisineId],
  }, state.adminToken);
  state.restaurantId = result.data.id;
});

await step('create table', async () => {
  const result = await request('POST', `/admin/restaurants/${state.restaurantId}/tables`, {
    tableNumber: `T-${suffix}`,
    capacity: 4,
  }, state.adminToken);
  state.tableId = result.data.id;
});

await step('create menu category and item', async () => {
  const category = await request('POST', `/admin/restaurants/${state.restaurantId}/menu-categories`, {
    title: `Smoke Menu ${suffix}`,
  }, state.adminToken);
  state.menuCategoryId = category.data.id;

  await request('POST', `/admin/menu-categories/${state.menuCategoryId}/items`, {
    title: `Smoke Dish ${suffix}`,
    description: 'Smoke-test dish',
    price: 420,
    weight: '250 g',
  }, state.adminToken);
});

await step('create photo and publish restaurant', async () => {
  await request('POST', `/admin/restaurants/${state.restaurantId}/photos`, {
    imageUrl: 'https://example.com/photo.jpg',
    isMain: true,
  }, state.adminToken);

  await request('PATCH', `/admin/restaurants/${state.restaurantId}/publication`, {
    isPublished: true,
  }, state.adminToken);
});

await step('register user', async () => {
  const result = await request('POST', '/auth/register', {
    firstName: 'Smoke',
    lastName: 'User',
    email: `smoke${suffix}@example.com`,
    phone: `+79${String(suffix).slice(-9)}`,
    password: 'password123',
    passwordConfirmation: 'password123',
  });
  state.userToken = result.data.tokens.accessToken;
});

await step('search restaurant through gateway', async () => {
  const result = await request('GET', `/restaurants?city=Smoke%20City%20${suffix}`);
  const found = result.data.some((restaurant) => restaurant.id === state.restaurantId);
  if (!found) {
    throw new Error('Created restaurant was not found in search');
  }
});

await step('load composed restaurant detail', async () => {
  const result = await request('GET', `/restaurants/${state.restaurantId}`);
  if (!result.data.menu?.length || !result.data.tables?.length) {
    throw new Error('Restaurant detail was not composed from menu/reservation services');
  }
});

await step('check availability', async () => {
  const result = await request('GET', `/restaurants/${state.restaurantId}/availability?reservationDate=2026-06-01&reservationTime=19:30&guestsCount=2`);
  if (!result.data.some((table) => table.id === state.tableId)) {
    throw new Error('Created table is not available');
  }
});

await step('create reservation', async () => {
  const result = await request('POST', '/reservations', {
    restaurantId: state.restaurantId,
    tableId: state.tableId,
    reservationDate: '2026-06-01',
    reservationTime: '19:30',
    guestsCount: 2,
    comment: 'Smoke reservation',
  }, state.userToken);
  state.reservationId = result.data.id;
  if (result.data.status !== 'PENDING') {
    throw new Error('Reservation status is not PENDING');
  }
});

await step('create review and update reservation status', async () => {
  await request('POST', `/restaurants/${state.restaurantId}/reviews`, {
    rating: 5,
    comment: 'Works well as microservices',
  }, state.userToken);

  const result = await request('PATCH', `/admin/reservations/${state.reservationId}/status`, {
    status: 'CONFIRMED',
  }, state.adminToken);

  if (result.data.status !== 'CONFIRMED') {
    throw new Error('Reservation status was not updated');
  }
});

console.log('\nSmoke test passed');
