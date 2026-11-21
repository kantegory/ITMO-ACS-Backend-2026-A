const express = require('express');
const sequelize = require('./config/db');
require('./models');

const app = express();
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/restaurants', require('./routes/restaurants'));
app.use('/reservations', require('./routes/reservations'));
app.use('/users', require('./routes/users'));

app.use((err, req, res, next) => {
  return res.status(500).json({ error: 'internal server error' });
});

sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
  });
});
