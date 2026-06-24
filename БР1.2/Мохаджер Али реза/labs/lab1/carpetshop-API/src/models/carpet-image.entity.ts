import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Carpet } from './carpet.entity';

@Entity()
export class CarpetImage extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => Carpet, (carpet) => carpet.images, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    carpet: Carpet;

    @Column({ type: 'varchar', length: 2048, nullable: false })
    image_url: string;

    @Column({ type: 'boolean', default: false })
    is_main: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}

