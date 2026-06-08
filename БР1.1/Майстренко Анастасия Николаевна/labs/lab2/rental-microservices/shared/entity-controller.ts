import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { JsonController } from 'routing-controllers';
import { ControllerOptions } from 'routing-controllers/types/decorator-options/ControllerOptions';

interface EntityControllerOptions {
    baseRoute?: string;
    controllerOptions?: ControllerOptions;
    entity?: EntityTarget<ObjectLiteral>;
    dataSource?: DataSource;
}

type Constructor = { new (...args: any[]): any };

/**
 * Декоратор контроллера: регистрирует JsonController и внедряет репозиторий
 * указанной сущности из переданного источника данных конкретного сервиса.
 */
function EntityController(options: EntityControllerOptions = {}) {
    const { baseRoute, controllerOptions, entity, dataSource } = options;

    return function (target: Constructor): Constructor {
        JsonController(baseRoute, controllerOptions)(target);

        if (entity && dataSource) {
            Object.defineProperty(target.prototype, 'repository', {
                get(): Repository<ObjectLiteral> {
                    return dataSource.getRepository(entity);
                },
                configurable: true,
            });
        }

        return target as Constructor;
    };
}

export default EntityController;
