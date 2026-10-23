import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

// Клиенты сервисных токенов (client credentials): секрет хранится только в виде хеша
@Entity('service_clients')
export class ServiceClient extends BaseEntity {
    @PrimaryColumn({ type: 'varchar', length: 100 }) clientId: string;
    @Column({ type: 'varchar', length: 128 }) secretHash: string;
    @Column({ type: 'simple-array' }) allowedAudiences: string[];
    @Column({ type: 'boolean', default: true }) isActive: boolean;
}
