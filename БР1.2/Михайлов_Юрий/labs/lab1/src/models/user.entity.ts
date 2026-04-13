import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
} from 'typeorm';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 300, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 300, unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    phone: string;

    @Column({ type: 'varchar', length: 300, nullable: false })
    another_contact: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @Column({ type: 'varchar', length: 150, nullable: false, select: false })
    password: string;
}
