import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '../common/enums';

export class CreateReservationDto {
    @IsNumber()
    @Type(() => Number)
    table_id!: number;

    @Type(() => String)
    start_time!: string;

    @Type(() => String)
    end_time!: string;

    @IsNumber()
    @Type(() => Number)
    guest_number!: number;
}

export class UpdateReservationDto {
    @IsOptional()
    @Type(() => String)
    start_time?: string;

    @IsOptional()
    @Type(() => String)
    end_time?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    guest_number?: number;

    @IsOptional()
    status?: ReservationStatus;
}
