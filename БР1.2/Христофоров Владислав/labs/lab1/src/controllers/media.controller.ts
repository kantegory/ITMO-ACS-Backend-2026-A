import {
    JsonController,
    Post,
    UseBefore,
    UploadedFile,
    HttpError,
} from 'routing-controllers';
import authMiddleware from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const uploadOptions = {
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const uniqueSuffix =
                Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        },
    }),
};

@JsonController('/upload')
export class MediaController {
    @Post('/')
    @UseBefore(authMiddleware)
    async upload(@UploadedFile('file', { options: uploadOptions }) file: any) {
        if (!file)
            throw new HttpError(
                400,
                'Файл не загружен или формат не поддерживается',
            );

        return { url: `/uploads/${file.filename}` };
    }
}
