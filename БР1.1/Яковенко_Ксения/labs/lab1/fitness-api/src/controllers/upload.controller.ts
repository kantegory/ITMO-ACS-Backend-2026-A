import { Body, Post, Req, UseBefore, BadRequestError, ForbiddenError } from 'routing-controllers';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import fs from 'fs/promises';
import path from 'path';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';

class UploadBlogImageDto {
  @IsString()
  @Type(() => String)
  imageBase64!: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  fileName?: string;
}

function ensureBlogManager(request: RequestWithUser) {
  const role = request.user?.role;
  if (!role || !['trainer', 'admin'].includes(role)) {
    throw new ForbiddenError('Only trainer or admin can upload blog images');
  }
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

class UploadController {
  @Post('/uploads/blog-image')
  @UseBefore(authMiddleware)
  async uploadBlogImage(
    @Req() request: RequestWithUser,
    @Body({ type: UploadBlogImageDto }) body: UploadBlogImageDto,
  ) {
    ensureBlogManager(request);

    if (!body.imageBase64) {
      throw new BadRequestError('imageBase64 is required');
    }

    let base64Data = body.imageBase64;
    let extension = '.png';

    const dataUrlMatch = body.imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (dataUrlMatch) {
      const type = dataUrlMatch[1].toLowerCase();
      base64Data = dataUrlMatch[2];
      if (type === 'jpeg') extension = '.jpg';
      else if (type === 'jpg') extension = '.jpg';
      else if (type === 'webp') extension = '.webp';
      else extension = '.png';
    } else if (body.fileName) {
      const ext = path.extname(body.fileName);
      if (ext) {
        extension = ext.toLowerCase();
      }
    }

    const fileName = body.fileName
      ? sanitizeFileName(body.fileName)
      : `blog-${Date.now()}${extension}`;

    const finalFileName = fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;

    const uploadsDir = path.join(process.cwd(), 'uploads', 'blog');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, finalFileName);
    const buffer = Buffer.from(base64Data, 'base64');

    await fs.writeFile(filePath, buffer);

    return {
      url: `/uploads/blog/${finalFileName}`,
      fileName: finalFileName,
    };
  }
}

export default UploadController;