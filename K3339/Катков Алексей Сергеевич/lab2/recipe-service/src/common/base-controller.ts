import { ObjectLiteral, Repository } from 'typeorm';

class BaseController {
    repository!: Repository<ObjectLiteral>;
}
export default BaseController;
