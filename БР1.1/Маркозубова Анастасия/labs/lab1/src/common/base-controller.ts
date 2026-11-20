import { Repository, ObjectLiteral } from 'typeorm';

class BaseController {
    repository!: Repository<ObjectLiteral>;
}

export default BaseController;
