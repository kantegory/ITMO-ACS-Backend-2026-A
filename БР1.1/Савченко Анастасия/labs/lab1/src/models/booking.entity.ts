import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./user.entity"  // связь: кто забронировал
import { Restaurant } from "./restaurant.entity" // связь: в каком ресторане
import { Table } from "./table.entity" // связь: какой столик


//  файл описывает таблицу bookings в БД(все бронирования столиков) TypeORM автопревращает этот класс в SQL табл
// декораторы TypeORM: @Entity — создать таблицу, @Column — колонку
// @PrimaryGeneratedColumn — автоинкрементный ID
// @CreateDateColumn/@UpdateDateColumn — даты создания/обновления
// @ManyToOne + @JoinColumn — связь с другой таблицей (внешний ключ)
@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn()
  booking_id: number

  @Column({ type: "int" })
  user_id: number

  @Column({ type: "int" })
  restaurant_id: number

  @Column({ type: "int" })
  table_id: number

  @Column({ type: "date" })
  date: string

  @Column({ type: "time" })
  reservation_start: string

  @Column({ type: "time" })
  reservation_end: string

  @Column({ type: "int" })
  party_size: number

  @Column({ type: "enum", enum: ["pending", "confirmed", "cancelled", "done"], default: "pending" }) // перечисление: только эти 4 значения по умолчанию — ожидает подтверждения
  state: string // статус брони

  @Column({ type: "text", nullable: true }) // необязательное поле (пожелания)
  notes: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  // === связи с другими таблицами ===

  // ОДНА бронь принадлежит ОДНОМУ пользователю
  @ManyToOne(() => User, user => user.bookings)
  @JoinColumn({ name: "user_id" })
  user: User
  // ОДНА бронь в ОДНОМ ресторане
  @ManyToOne(() => Restaurant, restaurant => restaurant.bookings)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant
  // ОДНА бронь на ОДИН столик
  @ManyToOne(() => Table, table => table.bookings)
  @JoinColumn({ name: "table_id" })
  table: Table
}