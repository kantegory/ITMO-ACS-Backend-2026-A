import { createDataSource } from '../../shared/data-source-factory';
import { User } from './models/user.entity';

const dataSource = createDataSource('identity', [User]);

export default dataSource;
