import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { JsonController } from 'routing-controllers';
import { ControllerOptions } from 'routing-controllers/types/decorator-options/ControllerOptions';

import dataSource from '../config/data-source';

// Интерфейс для опций нашего декоратора
interface EntityControllerOptions {
    baseRoute?: string;
    controllerOptions?: ControllerOptions;
    entity?: EntityTarget<ObjectLiteral>;
}

// Интерфейс для классов, использующих декоратор
export interface WithRepository {
    repository: Repository<ObjectLiteral>;
}

// Тип для конструктора класса
type Constructor = {
    new (...args: any[]): any;
};

function EntityController(options: EntityControllerOptions = {}) {
    const { baseRoute, controllerOptions, entity } = options;

    return function (target: Constructor): Constructor {
        // Применяем стандартный декоратор JsonController из routing-controllers
        JsonController(baseRoute, controllerOptions)(target);

        // Если указан entity, добавляем repository как свойство класса
        if (entity) {
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
