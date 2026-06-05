import { EventSubscriber, EntitySubscriberInterface } from 'typeorm';

import { User } from './user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    listenTo() {
        return User;
    }
}
