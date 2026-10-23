import { jwksFromIdentity, startService } from '@jobsearch/common';
import { dataSource } from './db';
import NotificationController from './controllers/notification.controller';
import { startNotificationConsumer } from './consumer';

startService({
    name: 'notification-service', port: parseInt(process.env.PORT || '8007'), dataSource, jwks: jwksFromIdentity(),
    controllers: [NotificationController],
    onReady: async () => { startNotificationConsumer(); },
});
