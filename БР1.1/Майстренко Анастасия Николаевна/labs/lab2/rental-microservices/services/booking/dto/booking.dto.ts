import { IsInt, IsDateString, IsEnum, Min, Max, IsString, IsOptional } from 'class-validator';
import { BookingStatus } from '../models/booking.entity';

export class CreateBookingDto {
    @IsInt() propertyId: number;
    @IsDateString() startDate: string;
    @IsDateString() endDate: string;
}

export class UpdateBookingStatusDto {
    @IsEnum(BookingStatus) status: BookingStatus;
}

export class CreateReviewDto {
    @IsInt() @Min(1) @Max(5) rating: number;
    @IsOptional() @IsString() text?: string;
}
