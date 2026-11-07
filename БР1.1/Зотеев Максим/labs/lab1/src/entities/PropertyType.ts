import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("property_types")
export class PropertyType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}
