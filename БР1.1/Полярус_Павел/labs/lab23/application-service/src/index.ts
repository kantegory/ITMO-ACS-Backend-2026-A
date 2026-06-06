import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { connectRabbitMQ } from './messaging/publisher';
import app from './app';

const PORT = parseInt(process.env.PORT || '3000');

AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected');
    await connectRabbitMQ();
    app.listen(PORT, () => console.log(`application-service running on port ${PORT}`));
  })
  .catch((err) => { console.error(err); process.exit(1); });
