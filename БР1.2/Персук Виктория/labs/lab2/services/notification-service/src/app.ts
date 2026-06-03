import { startNotificationConsumer } from './messaging/consumer';

console.log('Starting notification-service...');

startNotificationConsumer()
    .then(() => console.log('notification-service running'))
    .catch((err) => {
        console.error('Failed to start notification-service:', err);
        process.exit(1);
    });
