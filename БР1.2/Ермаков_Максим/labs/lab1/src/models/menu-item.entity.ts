import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { MenuCategory } from './menu-category.entity';

@Entity({ name: 'menu_items' })
@Unique(['menuCategory', 'title'])
export class MenuItem extends AppBaseEntity {
    @Column({ type: 'varchar', length: 150 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'float' })
    price: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    weight?: string | null;

    @Column({ type: 'boolean', default: true })
    isAvailable: boolean;

    @ManyToOne(() => MenuCategory, (menuCategory) => menuCategory.items, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'menuCategoryId' })
    menuCategory: MenuCategory;
}
