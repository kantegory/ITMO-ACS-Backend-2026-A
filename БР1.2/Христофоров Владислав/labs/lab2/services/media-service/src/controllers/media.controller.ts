import {
    JsonController,
    Post,
    UploadedFile,
    HttpCode,
    UseBefore,
    BadRequestError,
} from "routing-controllers";
import { extractUserMiddleware } from "../middlewares/extract-user.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const uploadOptions = {
    storage: storage,
    fileFilter: (req: any, file: any, cb: any) => {
        if (
            file.mimetype.startsWith("image/") ||
            file.mimetype.startsWith("video/")
        ) {
            cb(null, true);
        } else {
            cb(
                new BadRequestError("Разрешены только изображения и видео"),
                false,
            );
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
};

@JsonController("/upload")
export class MediaController {
    @Post("/")
    @HttpCode(200)
    @UseBefore(extractUserMiddleware)
    async uploadFile(
        @UploadedFile("file", { options: uploadOptions })
        file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestError(
                "Файл не был загружен. Убедитесь, что поле называется 'file'",
            );
        }

        return { url: `/uploads/${file.filename}` };
    }
}
