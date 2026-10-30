import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { MenuItem } from './menu-item.entity';
import { Restaurant } from './restaurant.entity';

@Entity({ name: 'menu_categories' })
@Unique(['restaurant', 'title'])
export class MenuCategory extends AppBaseEntity {
    @Column({ type: 'varchar', length: 120 })
    title: string;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.menuCategories, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'restaurantId' })
    restaurant: Restaurant;

    @OneToMany(() => MenuItem, (item) => item.menuCategory)
    items: MenuItem[];
}
