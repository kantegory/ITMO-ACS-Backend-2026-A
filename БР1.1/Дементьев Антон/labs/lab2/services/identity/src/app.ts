import { startOutboxDispatcher, startService, SERVICE_NAMES } from '@jobsearch/common';
import { dataSource } from './db';
import { jwksSource } from './auth';
import AuthController from './controllers/auth.controller';
import UserController from './controllers/user.controller';
import InternalController from './controllers/internal.controller';
import { ServiceClient } from './models/service-client.entity';
import { sha256 } from './utils/tokens';

// Клиенты сервисных токенов берутся из SERVICE_CLIENTS="имя:секрет,имя:секрет"
const seedClients = async () => {
    const repo = dataSource.getRepository(ServiceClient);
    for (const pair of (process.env.SERVICE_CLIENTS || '').split(',').filter(Boolean)) {
        const [clientId, ...rest] = pair.split(':');
        await repo.save(repo.create({ clientId, secretHash: sha256(rest.join(':')), allowedAudiences: [...SERVICE_NAMES], isActive: true }));
    }
};

startService({
    name: 'identity-service', port: parseInt(process.env.PORT || '8001'), dataSource, jwks: jwksSource,
    controllers: [AuthController, UserController, InternalController],
    publicInternal: ['/auth/service-token', '/.well-known/jwks.json'],
    onReady: async () => {
        await seedClients();
        startOutboxDispatcher(dataSource);
    },
});
