import { JsonController, Post, UseBefore } from 'routing-controllers';
import authMiddleware from '../middlewares/auth.middleware';

@JsonController('/upload')
export class MediaController {
    // Заглушка
    @Post('/')
    @UseBefore(authMiddleware)
    async upload() {
        return {
            url: '[https://example.com/placeholder-image.jpg](https://example.com/placeholder-image.jpg)',
        };
    }
}
