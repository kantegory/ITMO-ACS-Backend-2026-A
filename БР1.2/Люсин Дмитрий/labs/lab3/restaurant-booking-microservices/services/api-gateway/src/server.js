require('dotenv').config();
const app = require('./app');

const port = process.env.GATEWAY_PORT || 3000;

app.listen(port, () => {
  console.log(`API Gateway is running on http://localhost:${port}`);
});
