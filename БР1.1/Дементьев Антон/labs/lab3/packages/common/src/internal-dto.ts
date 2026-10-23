import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';

// Пакетный запрос по идентификаторам (lookup): от 1 до 100 id
export class IdsDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(100)
    @IsUUID('all', { each: true })
    ids: string[];
}
