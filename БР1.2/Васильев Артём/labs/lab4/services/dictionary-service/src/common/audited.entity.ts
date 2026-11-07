import {
    BaseEntity,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';

export abstract class AuditedEntity extends BaseEntity {
    @Expose()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Expose({ name: 'created_at' })
    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp with time zone',
    })
    createdAt: Date;

    @Expose({ name: 'updated_at' })
    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp with time zone',
    })
    updatedAt: Date;
}
