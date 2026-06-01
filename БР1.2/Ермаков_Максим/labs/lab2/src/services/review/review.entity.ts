import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from '../../common/base.entity';

@Entity({ name: 'reviews' })
@Index(['restaurantId', 'userId'], { unique: true })
export class Review extends AppBaseEntity {
    @Column({ type: 'uuid' })
    restaurantId: string;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'float' })
    rating: number;

    @Column({ type: 'text' })
    comment: string;
}
