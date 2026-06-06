import { startConsumer } from './consumer';

startConsumer().catch((err) => {
  console.error('notification-service failed to start:', err);
  process.exit(1);
});
