import { Get, Post, Body, HttpCode } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsString } from 'class-validator';
import { Type } from 'class-transformer';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Cuisine } from '../models/cuisine.entity';

class CreateCuisineDto {
    @IsString()
    @Type(() => String)
    name!: string;
}

@EntityController({ baseRoute: '/cuisines', entity: Cuisine })
class CuisineController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Get all cuisines' })
    async getAll() {
        return await this.repository.find();
    }

    @Post('')
    @HttpCode(201)
    @OpenAPI({ summary: 'Create a cuisine' })
    async create(@Body({ type: CreateCuisineDto }) body: CreateCuisineDto) {
        const cuisine = this.repository.create(body);
        return await this.repository.save(cuisine);
    }
}

export default CuisineController;
