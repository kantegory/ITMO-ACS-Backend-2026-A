import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AppBaseEntity } from '../../common/base.entity';

@Entity({ name: 'menu_categories' })
export class MenuCategory extends AppBaseEntity {
    @Column({ type: 'uuid' })
    restaurantId: string;

    @Column({ type: 'varchar', length: 120 })
    title: string;

    @OneToMany(() => MenuItem, (item) => item.menuCategory)
    items: MenuItem[];
}

@Entity({ name: 'menu_items' })
export class MenuItem extends AppBaseEntity {
    @Column({ type: 'varchar', length: 150 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'float' })
    price: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    weight?: string;

    @Column({ type: 'boolean', default: true })
    isAvailable: boolean;

    @ManyToOne(() => MenuCategory, (menuCategory) => menuCategory.items, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    menuCategory: MenuCategory;
}
