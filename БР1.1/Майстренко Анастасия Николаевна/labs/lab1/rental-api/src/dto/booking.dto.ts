import { IsInt, IsDateString, IsEnum } from 'class-validator';
import { BookingStatus } from '../models/enums';

export class CreateBookingDto {
    @IsInt()
    propertyId: number;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;
}

export class UpdateBookingStatusDto {
    @IsEnum(BookingStatus)
    status: BookingStatus;
}
