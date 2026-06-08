import { createDataSource } from '../../shared/data-source-factory';
import { Booking } from './models/booking.entity';
import { Review } from './models/review.entity';

const dataSource = createDataSource('booking', [Booking, Review]);

export default dataSource;
