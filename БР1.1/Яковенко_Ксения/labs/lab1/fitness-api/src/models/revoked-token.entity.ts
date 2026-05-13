import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
} from 'typeorm';

@Entity('revoked_tokens')
export class RevokedToken extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: false, unique: true })
  token!: string;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}