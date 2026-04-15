import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsString, IsNumber, IsEnum, MaxLength, Min, Max, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Cuisine } from './Cuisine.entity';
import { RestaurantImage } from './RestaurantImage.entity';
import { Table } from './Table.entity';
import { MenuItem } from './MenuItem.entity';
import { Review } from './Review.entity';
import { Booking } from './Booking.entity';

export enum RestaurantStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum OperationalStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  UNDER_RENOVATION = 'under_renovation',
  TEMPORARILY_CLOSED = 'temporarily_closed',
  COMING_SOON = 'coming_soon',
}

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  @MaxLength(200)
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ManyToOne(() => Cuisine, (cuisine) => cuisine.restaurants, { eager: true })
  @JoinColumn({ name: 'cuisine_id' })
  cuisine: Cuisine;

  @Column()
  @IsString()
  @MaxLength(100)
  city: string;

  @Column({ type: 'text' })
  @IsString()
  address: string;

  @Column({ name: 'avg_price_per_person', type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  avgPricePerPerson?: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @Column({
    type: 'enum',
    enum: RestaurantStatus,
    default: RestaurantStatus.ACTIVE,
  })
  @IsEnum(RestaurantStatus)
  status: RestaurantStatus;

  @Column({
    name: 'operational_status',
    type: 'enum',
    enum: OperationalStatus,
    default: OperationalStatus.OPEN,
  })
  @IsEnum(OperationalStatus)
  operationalStatus: OperationalStatus;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHours)
  workingHours?: WorkingHours[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RestaurantImage, (image) => image.restaurant)
  images: RestaurantImage[];

  @OneToMany(() => Table, (table) => table.restaurant)
  tables: Table[];

  @OneToMany(() => MenuItem, (menuItem) => menuItem.restaurant)
  menuItems: MenuItem[];

  @OneToMany(() => Review, (review) => review.restaurant)
  reviews: Review[];

  @OneToMany(() => Booking, (booking) => booking.restaurant)
  bookings: Booking[];

  // Computed properties
  get avgRating(): number | null {
    if (!this.reviews || this.reviews.length === 0) return null;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return parseFloat((sum / this.reviews.length).toFixed(1));
  }

  get mainImageUrl(): string | null {
    if (!this.images || this.images.length === 0) return null;
    const mainImage = this.images.find((img) => img.isMain);
    return mainImage ? mainImage.imageUrl : this.images[0].imageUrl;
  }

  toListItemResponse(): RestaurantListItemResponse {
    return {
      id: this.id,
      name: this.name,
      city: this.city,
      cuisine_name: this.cuisine?.name || '',
      avg_price_per_person: this.avgPricePerPerson || null,
      avg_rating: this.avgRating,
      main_image_url: this.mainImageUrl,
    };
  }

  toDetailResponse(): RestaurantDetailResponse {
    return {
      ...this.toListItemResponse(),
      description: this.description || null,
      address: this.address,
      latitude: this.latitude || null,
      longitude: this.longitude || null,
      status: this.status,
      operational_status: this.operationalStatus,
      working_hours: this.workingHours || [],
      images: this.images?.map((img) => img.toResponse()) || [],
      menu: this.menuItems?.map((item) => item.toResponse()) || [],
      reviews: this.reviews?.map((review) => review.toResponse()) || [],
      created_at: this.createdAt,
    };
  }
}

export class WorkingHours {
  @IsNumber()
  @Min(0)
  @Max(6)
  day_of_week: number; // 0 - Monday, 6 - Sunday

  @IsString()
  open_time?: string; // "11:00"

  @IsString()
  close_time?: string; // "22:00"

  @IsOptional()
  @IsNumber()
  is_closed?: boolean;
}

export interface RestaurantListItemResponse {
  id: number;
  name: string;
  city: string;
  cuisine_name: string;
  avg_price_per_person: number | null;
  avg_rating: number | null;
  main_image_url: string | null;
}

export interface RestaurantDetailResponse extends RestaurantListItemResponse {
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: RestaurantStatus;
  operational_status: OperationalStatus;
  working_hours: WorkingHours[];
  images: any[];
  menu: any[];
  reviews: any[];
  created_at: Date;
}
