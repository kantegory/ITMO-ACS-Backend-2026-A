import { Get, JsonController } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

@JsonController('/health')
class HealthController {
    @Get('')
    @OpenAPI({ summary: 'Проверка состояния сервиса' })
    health() {
        return { status: 'ok', version: '1.0.0' };
    }
}

export default HealthController;
