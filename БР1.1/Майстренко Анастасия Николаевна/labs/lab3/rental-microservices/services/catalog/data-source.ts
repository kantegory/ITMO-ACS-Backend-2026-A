import { createDataSource } from '../../shared/data-source-factory';
import { Property } from './models/property.entity';
import { Amenity } from './models/amenity.entity';

const dataSource = createDataSource('catalog', [Property, Amenity]);

export default dataSource;
