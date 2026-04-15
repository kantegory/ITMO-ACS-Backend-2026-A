import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { UserRole } from '../enums/role.enum';
import { Company } from './company.entity';
import { ServiceRequest } from './service-request.entity';
import { Review } from './review.entity';
import { Favorite } from './favorite.entity';
import { RefreshToken } from './refresh-token.entity';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 300, unique: true, nullable: false })
    email: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ type: 'varchar', length: 150, nullable: false })
    firstName: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    lastName: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    middleName?: string | null;

    @Column({ type: 'boolean', default: false })
    isVerified: boolean;

    @Column({ type: 'varchar', length: 150, nullable: false, select: false })
    password: string;

    @OneToMany(() => Company, (company) => company.owner)
    companies: Company[];

    @OneToMany(() => ServiceRequest, (request) => request.user)
    requests: ServiceRequest[];

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];

    @OneToMany(() => Favorite, (favorite) => favorite.user)
    favorites: Favorite[];

    @OneToMany(() => RefreshToken, (token) => token.user)
    refreshTokens: RefreshToken[];
}
