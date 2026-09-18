import fs from 'fs';
import path from 'path';
import multer from 'multer';
import {
    BadRequestError,
    Body,
    Delete,
    ForbiddenError,
    Get,
    NotFoundError,
    Param,
    Post,
    Put,
    QueryParam,
    Req,
    UploadedFile,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { PropertyImage } from '../models/property-image.entity';
import { Property } from '../models/property.entity';
import {ObjectLiteral} from "typeorm";

const uploadsDir = path.resolve(process.cwd(), 'uploads');
const imageStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        fs.mkdirSync(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const uploadImageOptions = {
    storage: imageStorage,
    fileFilter: (
        _req: any,
        file: Express.Multer.File,
        cb: multer.FileFilterCallback,
    ) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
            return;
        }
        cb(new Error('Only images are allowed'));
    },
};

class CreatePropertyImageDto {
    @IsNumber()
    @Type(() => Number)
    property_id: number;

    @IsString()
    @Type(() => String)
    url: string;
}

class UploadImageBodyDto {
    @IsNumber()
    @Type(() => Number)
    property_id: number;
}

@EntityController({
    baseRoute: '/property-images',
    entity: PropertyImage,
})
class PropertyImagesController extends BaseController {

    @Get('')
    async list(
        @QueryParam('property_id') property_id?: number,
    ): Promise<ObjectLiteral[]> {
        if (typeof property_id === 'number') {
            return await this.repository.findBy({ property_id });
        }
        return await this.repository.find();
    }

    @Get('/:id')
    async get(@Param('id') id: number): Promise<PropertyImage> {
        const image = await this.repository.findOneBy({ id });
        if (!image) throw new NotFoundError('Image not found');
        return image as PropertyImage;
    }

    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreatePropertyImageDto }) body: CreatePropertyImageDto,
    ): Promise<{ id: number }> {
        const property = await this.ensureOwner(request.user.id, body.property_id);

        const created = this.repository.create({
            property_id: property.id,
            url: body.url,
        });
        const saved = await this.repository.save(created);
        return { id: saved.id };
    }

    @UseBefore(authMiddleware)
    @Post('/upload')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async upload(
        @Req() request: RequestWithUser,
        @Body({ type: UploadImageBodyDto }) body: UploadImageBodyDto,
        @UploadedFile('image', { options: uploadImageOptions })
        image: Express.Multer.File,
    ): Promise<{ id: number; url: string }> {
        if (!image) {
            throw new BadRequestError('Image is required');
        }

        await this.ensureOwner(request.user.id, body.property_id);

        const publicUrl = `/uploads/${image.filename}`;
        const created = this.repository.create({
            property_id: body.property_id,
            url: publicUrl,
        });
        const saved = await this.repository.save(created);

        return { id: saved.id, url: publicUrl };
    }

    @UseBefore(authMiddleware)
    @Put('/:id')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async update(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
        @Body({ type: CreatePropertyImageDto }) body: CreatePropertyImageDto,
    ): Promise<{ success: boolean }> {
        const image = await this.repository.findOneBy({ id });
        if (!image) throw new NotFoundError('Image not found');

        await this.ensureOwner(request.user.id, image.property_id);

        Object.assign(image, {
            property_id: image.property_id,
            url: body.url,
        });
        await this.repository.save(image);

        return { success: true };
    }

    @UseBefore(authMiddleware)
    @Delete('/:id')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async delete(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
    ): Promise<{ success: boolean }> {
        const image = await this.repository.findOneBy({ id });
        if (!image) throw new NotFoundError('Image not found');

        await this.ensureOwner(request.user.id, image.property_id);
        this.removeLocalFileIfNeeded(image.url);

        await this.repository.delete({ id });
        return { success: true };
    }

    private async ensureOwner(
        userId: number,
        propertyId: number,
    ): Promise<Property> {
        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: propertyId });
        if (!property) throw new NotFoundError('Property not found');
        if (property.owner_id !== userId) throw new ForbiddenError('Not owner');
        return property as Property;
    }

    private removeLocalFileIfNeeded(url: string): void {
        if (!url.startsWith('/uploads/')) return;
        const filename = url.replace('/uploads/', '');
        const fullPath = path.join(uploadsDir, filename);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
}

export default PropertyImagesController;

