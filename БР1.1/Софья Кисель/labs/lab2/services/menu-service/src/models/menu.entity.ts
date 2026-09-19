import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
} from 'typeorm';

import { MenuItem } from './menu-item.entity';

@Entity('menus')
export class Menu {
    @PrimaryGeneratedColumn()
    menu_id!: number;

    @Column({ type: 'int' })
    restaurant_id!: number;

    @Column({ type: 'varchar', length: 300, nullable: false })
    name!: string;

    @OneToMany(() => MenuItem, (item) => item.menu)
    menuItems!: MenuItem[];
}
