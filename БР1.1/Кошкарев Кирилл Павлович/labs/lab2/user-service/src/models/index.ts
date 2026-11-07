import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany,
  PrimaryGeneratedColumn, Unique, UpdateDateColumn,
} from 'typeorm';

export enum UserRole { USER = 'user', ADMIN = 'admin' }

/** Учётная запись кулинара. Владелец данных — user-service. */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 }) email: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 }) username: string;

  @Column({ type: 'varchar', length: 255, select: false }) passwordHash: string;
  @Column({ type: 'varchar', length: 128, nullable: true }) fullName: string | null;
  @Column({ type: 'text', nullable: true }) bio: string | null;
  @Column({ type: 'varchar', length: 512, nullable: true }) avatarUrl: string | null;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER }) role: UserRole;
  @Column({ type: 'boolean', default: true }) isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;

  @OneToMany(() => Follow, (follow) => follow.follower) following: Follow[];
  @OneToMany(() => Follow, (follow) => follow.following) followers: Follow[];
}

/** Подписка на публикации кулинара. */
@Entity('follows')
@Unique('uq_follow', ['followerId', 'followingId'])
export class Follow {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;

  @Column({ type: 'bigint' }) followerId: string;
  @ManyToOne(() => User, (user) => user.following, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' }) follower: User;

  @Index()
  @Column({ type: 'bigint' }) followingId: string;
  @ManyToOne(() => User, (user) => user.followers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followingId' }) following: User;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
