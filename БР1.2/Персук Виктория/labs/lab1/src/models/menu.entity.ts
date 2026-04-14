import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { MenuItem } from './menu-item.entity';

@Entity('menus')
export class Menu {
    @PrimaryGeneratedColumn()
    menu_id!: number;

    @Column()
    restaurant_id!: number;

    @Column({ type: 'varchar', length: 300, nullable: false })
    name!: string;

    @ManyToOne(() => Restaurant)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant!: Restaurant;

    @OneToMany(() => MenuItem, (item) => item.menu)
    menuItems!: MenuItem[];
}
