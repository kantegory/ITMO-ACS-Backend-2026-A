import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("locations")
export class Location {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  district: string;

  @Column()
  address: string;
}
