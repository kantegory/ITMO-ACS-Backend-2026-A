import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("articles")
export class Article {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "author_id", type: "uuid" }) authorId!: string;
  @Column({ length: 160 }) title!: string;
  @Index({ unique: true }) @Column({ length: 180 }) slug!: string;
  @Column({ type: "text" }) content!: string;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
}
