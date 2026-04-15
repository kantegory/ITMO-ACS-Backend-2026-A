import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false })
    user_id: number;

    @Column({ type: 'int', nullable: false })
    property_id: number;

    @Column({ type: 'int', nullable: false })
    rating: number;

    @Column({ type: 'text', nullable: false })
    comment: string;
}

