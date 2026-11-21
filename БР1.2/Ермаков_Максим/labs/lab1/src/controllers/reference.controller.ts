import { Get, JsonController } from 'routing-controllers';
import dataSource from '../config/data-source';
import { PriceCategory, ReservationStatus, UserRole } from '../common/enums';
import { serializeCuisine, serializeLocation } from '../common/serializers';
import { Cuisine } from '../models/cuisine.entity';
import { Location } from '../models/location.entity';

@JsonController('/reference')
class ReferenceController {
    private cuisineRepository = dataSource.getRepository(Cuisine);
    private locationRepository = dataSource.getRepository(Location);

    @Get('/cuisines')
    async listCuisines() {
        const cuisines = await this.cuisineRepository.find({
            order: {
                title: 'ASC',
            },
        });

        return {
            data: cuisines.map(serializeCuisine),
        };
    }

    @Get('/locations')
    async listLocations() {
        const locations = await this.locationRepository.find({
            order: {
                city: 'ASC',
                address: 'ASC',
            },
        });

        return {
            data: locations.map(serializeLocation),
        };
    }

    @Get('/price-categories')
    async listPriceCategories() {
        return {
            data: [
                { code: PriceCategory.LOW, label: 'Low' },
                { code: PriceCategory.MEDIUM, label: 'Medium' },
                { code: PriceCategory.HIGH, label: 'High' },
            ],
        };
    }

    @Get('/reservation-statuses')
    async listReservationStatuses() {
        return {
            data: [
                { code: ReservationStatus.PENDING, label: 'Pending' },
                { code: ReservationStatus.CONFIRMED, label: 'Confirmed' },
                { code: ReservationStatus.CANCELLED, label: 'Cancelled' },
                { code: ReservationStatus.COMPLETED, label: 'Completed' },
            ],
        };
    }

    @Get('/roles')
    async listRoles() {
        return {
            data: [
                { code: UserRole.ADMIN, label: 'Administrator' },
                { code: UserRole.USER, label: 'User' },
            ],
        };
    }
}

export default ReferenceController;
