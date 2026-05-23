import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { PropertyType, PropertyStatus, CurrencyType } from './enums';
import { PropertyPhoto } from './property-photo.entity';
import { PropertyPriceHistory } from './property-price-history.entity';
import { decimalTransformer } from '../utils/decimal-transformer';

@Entity('properties')
@Index(['city', 'type', 'pricePerMonth'])
export class Property extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    ownerId: number;

    @Column({ type: 'enum', enum: PropertyType, nullable: false })
    type: PropertyType;

    @Column({ type: 'varchar', nullable: false })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', nullable: false })
    street: string;

    @Column({ type: 'varchar', nullable: false })
    building: string;

    @Column({ type: 'varchar', nullable: true })
    apartment: string;

    @Column({ type: 'varchar', nullable: true })
    postalCode: string;

    @Index()
    @Column({ type: 'varchar', nullable: false })
    city: string;

    @Column({ type: 'varchar', nullable: false })
    country: string;

    @Column({ type: 'float', nullable: true })
    latitude: number;

    @Column({ type: 'float', nullable: true })
    longitude: number;

    @Index()
    @Column({ type: 'int', nullable: true })
    rooms: number;

    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, transformer: decimalTransformer })
    areaSqm: number;

    @Column({ type: 'int', nullable: true })
    floor: number;

    @Index()
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false, transformer: decimalTransformer })
    pricePerMonth: number;

    @Column({ type: 'enum', enum: CurrencyType, nullable: false, default: CurrencyType.RUB })
    currency: CurrencyType;

    @Column({ type: 'text', nullable: true })
    rentalConditions: string;

    @Index()
    @Column({ type: 'enum', enum: PropertyStatus, nullable: false, default: PropertyStatus.ACTIVE })
    status: PropertyStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @OneToMany(() => PropertyPhoto, (photo) => photo.property)
    photos: PropertyPhoto[];

    @OneToMany(() => PropertyPriceHistory, (history) => history.property)
    priceHistory: PropertyPriceHistory[];
}
