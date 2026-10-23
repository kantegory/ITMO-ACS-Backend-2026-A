import { IsUUID } from 'class-validator';

export class CreateFavoriteDto {
    @IsUUID()
    vacancy_id: string;
}
