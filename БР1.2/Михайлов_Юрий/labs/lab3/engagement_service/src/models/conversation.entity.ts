import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Conversation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false })
    user1_id: number;

    @Column({ type: 'int', nullable: false })
    user2_id: number;

    @Column({ type: 'int', nullable: false })
    property_id: number;
}

