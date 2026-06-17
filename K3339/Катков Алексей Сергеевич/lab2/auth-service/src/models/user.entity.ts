import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, OneToMany } from 'typeorm';
import { Follow } from './follow.entity';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @Column({ type: 'varchar', length: 100, unique: true }) username: string;
    @Column({ type: 'varchar', length: 300, unique: true }) email: string;
    @Column({ type: 'varchar', length: 150 }) password: string;
    @Column({ type: 'varchar', length: 150, nullable: true }) firstName: string;
    @Column({ type: 'varchar', length: 150, nullable: true }) lastName: string;
    @Column({ type: 'varchar', length: 500, nullable: true }) avatarUrl: string;
    @Column({ type: 'text', nullable: true }) bio: string;
    @CreateDateColumn() createdAt: Date;
    @OneToMany(() => Follow, (follow) => follow.follower) following: Follow[];
    @OneToMany(() => Follow, (follow) => follow.following) followers: Follow[];
}
