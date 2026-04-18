import {
    EventSubscriber,
    EntitySubscriberInterface,
    UpdateEvent,
    InsertEvent,
} from 'typeorm';
import { User } from './user.entity';

import hashPassword from '../utils/hash-password';
import checkPassword from '../utils/check-password';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    listenTo() {
        return User;
    }

    async beforeUpdate(event: UpdateEvent<User>) {
        if (event.entity && event.databaseEntity) {
            const changedColumns = event.updatedColumns.map(
                (col) => col.propertyName,
            );

            const isPasswordChanged = !checkPassword(
                event.databaseEntity.password_hash,
                event.entity.password_hash,
            );

            if (changedColumns.includes('password_hash') && isPasswordChanged) {
                event.entity.password_hash = hashPassword(
                    event.entity.password_hash,
                );
            } else {
                event.entity.password_hash = event.databaseEntity.password_hash;
            }
        }
    }

    async beforeInsert(event: InsertEvent<User>) {
        if (
            event.entity.password_hash &&
            !event.entity.password_hash.startsWith('$2b$')
        ) {
            event.entity.password_hash = hashPassword(
                event.entity.password_hash,
            );
        }
    }
}
