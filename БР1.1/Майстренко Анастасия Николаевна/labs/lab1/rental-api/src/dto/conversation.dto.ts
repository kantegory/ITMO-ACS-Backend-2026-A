import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConversationDto {
    @IsInt()
    recipientId: number;

    @IsOptional()
    @IsInt()
    propertyId?: number;
}

export class CreateMessageDto {
    @IsString()
    @MinLength(1)
    body: string;
}
