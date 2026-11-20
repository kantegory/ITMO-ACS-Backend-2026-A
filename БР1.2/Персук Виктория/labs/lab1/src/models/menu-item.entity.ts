import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    RelationId,
} from 'typeorm';
import { Menu } from './menu.entity';

@Entity('menu_items')
export class MenuItem {
    @PrimaryGeneratedColumn()
    item_id!: number;

    @Column({ type: 'int' })
    menu_id!: number;

    @Column({ type: 'varchar', length: 300, nullable: false })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
    price!: number;

    @ManyToOne(() => Menu, (menu) => menu.menuItems)
    @JoinColumn({ name: 'menu_id' })
    menu!: Menu;
}
