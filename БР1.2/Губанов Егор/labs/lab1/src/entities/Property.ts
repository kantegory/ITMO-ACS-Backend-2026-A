import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { PropertyType } from "./PropertyType";
import { Photo } from "./Photo";
import { RentalCondition } from "./RentalCondition";
import { Deal } from "./Deal";
import { Message } from "./Message";

@Entity("properties")
export class Property {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "owner_id" })
  ownerId!: string;

  @ManyToOne(() => User, (u) => u.properties, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @Column({ name: "type_id" })
  typeId!: string;

  @ManyToOne(() => PropertyType, (t) => t.properties)
  @JoinColumn({ name: "type_id" })
  type!: PropertyType;

  @Column()
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "decimal", precision: 14, scale: 2 })
  price!: string;

  @Column()
  city!: string;

  @Column()
  address!: string;

  @Column({ name: "is_published", default: false })
  isPublished!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => Photo, (p) => p.property)
  photos!: Photo[];

  @OneToMany(() => RentalCondition, (c) => c.property)
  conditions!: RentalCondition[];

  @OneToMany(() => Deal, (d) => d.property)
  deals!: Deal[];

  @OneToMany(() => Message, (m) => m.property)
  messages!: Message[];
}
