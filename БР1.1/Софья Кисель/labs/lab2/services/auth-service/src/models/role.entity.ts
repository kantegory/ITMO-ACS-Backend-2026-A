import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { RoleName } from '../common/enums';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    role_id!: number;

    @Column({ type: 'enum', enum: RoleName })
    name!: RoleName;
}
