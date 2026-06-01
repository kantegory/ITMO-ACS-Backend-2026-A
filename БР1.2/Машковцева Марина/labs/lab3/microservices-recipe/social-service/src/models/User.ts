import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class User {
    @PrimaryColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    email: string;
}