import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany,
  PrimaryColumn, PrimaryGeneratedColumn, Unique, UpdateDateColumn,
} from 'typeorm';

/** Лайк рецепта. recipeId/userId — «мягкие» ссылки в чужие базы. */
@Entity('likes')
@Unique('uq_like', ['userId', 'recipeId'])
export class Like {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Index() @Column({ type: 'bigint' }) userId: string;
  @Index() @Column({ type: 'bigint' }) recipeId: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('favorites')
@Unique('uq_favorite', ['userId', 'recipeId'])
export class Favorite {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Index() @Column({ type: 'bigint' }) userId: string;
  @Index() @Column({ type: 'bigint' }) recipeId: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Index() @Column({ type: 'bigint' }) recipeId: string;
  @Index() @Column({ type: 'bigint' }) authorId: string;

  @Index() @Column({ type: 'bigint', nullable: true }) parentId: string | null;
  @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parentId' }) parent: Comment | null;
  @OneToMany(() => Comment, (comment) => comment.parent) replies: Comment[];

  @Column({ type: 'text' }) body: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

/**
 * Локальная проекция рецепта. Наполняется событиями recipe.* и позволяет
 * social-service работать, не обращаясь к recipe-service на каждый запрос.
 */
@Entity('recipe_projection')
export class RecipeProjection {
  @PrimaryColumn({ type: 'bigint' }) recipeId: string;
  @Column({ type: 'varchar', length: 160 }) title: string;
  @Index() @Column({ type: 'bigint' }) authorId: string;
  @Column({ type: 'varchar', length: 16 }) status: string;
  @Column({ type: 'timestamptz' }) syncedAt: Date;
}

/** Локальная проекция профиля автора — чтобы отдавать комментарии с именем автора. */
@Entity('user_projection')
export class UserProjection {
  @PrimaryColumn({ type: 'bigint' }) userId: string;
  @Column({ type: 'varchar', length: 64 }) username: string;
  @Column({ type: 'varchar', length: 128, nullable: true }) fullName: string | null;
  @Column({ type: 'varchar', length: 512, nullable: true }) avatarUrl: string | null;
  @Column({ type: 'timestamptz' }) syncedAt: Date;
}

@Entity('processed_events')
export class ProcessedEvent {
  @PrimaryColumn({ type: 'uuid' }) eventId: string;
  @Column({ type: 'varchar', length: 64 }) type: string;
  @CreateDateColumn({ type: 'timestamptz' }) processedAt: Date;
}
