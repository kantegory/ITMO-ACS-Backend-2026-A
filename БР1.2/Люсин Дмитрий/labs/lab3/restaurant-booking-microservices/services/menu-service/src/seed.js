require('dotenv').config();
const { sequelize, MenuCategory, MenuItem } = require('./models');

const seed = async () => {
  await sequelize.sync({ force: true });

  const pasta = await MenuCategory.create({ restaurant_id: 1, name: 'Паста и пицца' });
  const drinks = await MenuCategory.create({ restaurant_id: 1, name: 'Напитки' });
  const rolls = await MenuCategory.create({ restaurant_id: 2, name: 'Роллы и рамен' });
  const georgian = await MenuCategory.create({ restaurant_id: 3, name: 'Грузинская классика' });

  await MenuItem.bulkCreate([
    { menu_category_id: pasta.id, name: 'Паста Карбонара', description: 'Паста со сливочным соусом и беконом', price: 690 },
    { menu_category_id: pasta.id, name: 'Пицца Маргарита', description: 'Томатный соус, моцарелла и базилик', price: 750 },
    { menu_category_id: drinks.id, name: 'Лимонад', description: 'Домашний лимонад', price: 290 },
    { menu_category_id: rolls.id, name: 'Рамен с курицей', description: 'Бульон, лапша, курица и яйцо', price: 640 },
    { menu_category_id: rolls.id, name: 'Филадельфия', description: 'Ролл с лососем и сливочным сыром', price: 590 },
    { menu_category_id: georgian.id, name: 'Хинкали', description: 'Пять штук', price: 520 },
    { menu_category_id: georgian.id, name: 'Хачапури по-аджарски', description: 'Сыр, тесто и яйцо', price: 610 }
  ]);

  console.log('Menu Service database seeded');
  await sequelize.close();
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
