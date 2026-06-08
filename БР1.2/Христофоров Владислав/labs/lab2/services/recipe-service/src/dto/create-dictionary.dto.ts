import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDictionaryDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
