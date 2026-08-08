import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('media_files')
export class MediaFile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ type: 'varchar', length: 150 })
  mimeType!: string;

  @Column({ type: 'varchar', length: 700 })
  storageUrl!: string;

  @Column({ type: 'int' })
  sizeBytes!: number;

  @Column({ type: 'int' })
  ownerId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
