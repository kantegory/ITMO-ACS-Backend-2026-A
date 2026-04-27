import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { CarpetImage } from './carpet-image.entity';
import { Review } from './review.entity';

export type CarpetShape =
    | 'RECTANGLE'
    | 'SQUARE'
    | 'CIRCLE'
    | 'ELLIPSE'
    | 'RUNNER'
    | 'CUSTOM';

@Entity()
export class Carpet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => Category, (category) => category.carpets, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    category: Category;

    @Column({ type: 'varchar', length: 300, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'numeric', nullable: false })
    price: string;

    @Column({ type: 'int', nullable: false, default: 0 })
    stock: number;

    @Column({
        type: 'enum',
        enum: ['RECTANGLE', 'SQUARE', 'CIRCLE', 'ELLIPSE', 'RUNNER', 'CUSTOM'],
        nullable: false,
    })
    shape: CarpetShape;

    @Column({ type: 'numeric', nullable: true })
    length: string | null;

    @Column({ type: 'numeric', nullable: true })
    width: string | null;

    @Column({ type: 'numeric', nullable: true })
    diameter: string | null;

    @Column({ type: 'varchar', length: 120, nullable: true })
    material: string | null;

    @Column({ type: 'varchar', length: 120, nullable: true })
    pattern: string | null;

    @Index()
    @Column({ type: 'varchar', length: 80, nullable: true })
    color: string | null;

    @Column({ type: 'boolean', default: false })
    is_handmade: boolean;

    @Column({ type: 'boolean', default: false })
    is_published: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;

    @OneToMany(() => CarpetImage, (img) => img.carpet)
    images: CarpetImage[];

    @OneToMany(() => Review, (review) => review.carpet)
    reviews: Review[];
}
