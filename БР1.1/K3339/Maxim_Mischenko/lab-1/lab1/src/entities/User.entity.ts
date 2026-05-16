import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsEmail, IsEnum, IsString, MinLength, MaxLength, IsOptional, IsPhoneNumber } from 'class-validator';
import { Booking } from './Booking.entity';
import { Review } from './Review.entity';

export enum UserRole {
  GUEST = 'guest',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ name: 'full_name' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Column()
  @IsString()
  @MinLength(6)
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.GUEST,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  // Methods
  toResponse(): UserResponse {
    return {
      id: this.id,
      email: this.email,
      full_name: this.fullName,
      phone: this.phone || null,
      role: this.role,
      created_at: this.createdAt,
    };
  }
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: Date;
}
