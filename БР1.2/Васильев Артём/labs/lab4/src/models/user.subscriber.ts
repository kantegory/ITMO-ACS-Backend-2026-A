import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
} from 'typeorm';

import { User } from './user.entity';
import hashPassword from '../utils/hash-password';
import checkPassword from '../utils/check-password';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    listenTo() {
        return User;
    }

    beforeInsert(event: InsertEvent<User>) {
        if (
            event.entity.password &&
            !event.entity.password.startsWith('$2b$')
        ) {
            event.entity.password = hashPassword(event.entity.password);
        }
    }

    beforeUpdate(event: UpdateEvent<User>) {
        if (!event.entity || !event.databaseEntity) {
            return;
        }

        const changedColumns = event.updatedColumns.map(
            (column) => column.propertyName,
        );

        if (!changedColumns.includes('password')) {
            event.entity.password = event.databaseEntity.password;
            return;
        }

        const isSamePassword = checkPassword(
            event.databaseEntity.password,
            event.entity.password,
        );

        event.entity.password = isSamePassword
            ? event.databaseEntity.password
            : hashPassword(event.entity.password);
    }
}
