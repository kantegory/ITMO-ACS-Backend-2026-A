import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Property } from './property.entity';
import { CurrencyType } from './enums';
import { decimalTransformer } from '../utils/decimal-transformer';

@Entity('property_price_history')
export class PropertyPriceHistory extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ nullable: false })
    propertyId: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false, transformer: decimalTransformer })
    pricePerMonth: number;

    @Column({ type: 'enum', enum: CurrencyType, nullable: false })
    currency: CurrencyType;

    @Index()
    @CreateDateColumn()
    changedAt: Date;

    @ManyToOne(() => Property, (property) => property.priceHistory, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'propertyId' })
    property: Property;
}
