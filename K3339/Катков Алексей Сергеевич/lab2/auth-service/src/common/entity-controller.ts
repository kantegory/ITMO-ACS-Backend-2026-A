import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { JsonController } from 'routing-controllers';
import dataSource from '../config/data-source';

type Constructor = { new (...args: any[]): any };

interface EntityControllerOptions {
    baseRoute?: string;
    entity?: EntityTarget<ObjectLiteral>;
}

function EntityController(options: EntityControllerOptions = {}) {
    return function (target: Constructor): Constructor {
        JsonController(options.baseRoute)(target);
        if (options.entity) {
            Object.defineProperty(target.prototype, 'repository', {
                get(): Repository<ObjectLiteral> {
                    return dataSource.getRepository(options.entity!);
                },
                configurable: true,
            });
        }
        return target;
    };
}
export default EntityController;
