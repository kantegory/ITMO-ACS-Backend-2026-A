import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne
} from "typeorm"

import { User } from "./User"

@Entity()
export class Recipe {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    difficulty: string

    @Column()
    cooking_time: number

    @ManyToOne(() => User)
    author: User
}