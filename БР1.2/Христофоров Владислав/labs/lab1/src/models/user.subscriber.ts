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
                event.databaseEntity.password,
                event.entity.password,
            );

            if (changedColumns.includes('password') && isPasswordChanged) {
                event.entity.password = hashPassword(event.entity.password);
            } else {
                event.entity.password = event.databaseEntity.password;
            }
        }
    }

    async beforeInsert(event: InsertEvent<User>) {
        if (
            event.entity.password &&
            !event.entity.password.startsWith('$2b$')
        ) {
            event.entity.password = hashPassword(event.entity.password);
        }
    }
}
