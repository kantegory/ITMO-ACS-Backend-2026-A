import { createApp } from './app';
import { config } from './config';
import { connectRabbitMQ } from './services/eventBus.js';

const app = createApp();

// Подключаемся к RabbitMQ (неблокирующе)
connectRabbitMQ();

app.listen(config.port, () => {
    console.log(`recipe-service запущен на порту ${config.port}`);
});
