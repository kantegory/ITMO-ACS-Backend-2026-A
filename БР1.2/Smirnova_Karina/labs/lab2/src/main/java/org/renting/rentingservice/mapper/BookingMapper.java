package org.renting.rentingservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.renting.rentingservice.domain.entity.BookingEntity;
import org.renting.rentingservice.dto.booking.BookingResponse;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(target = "listingId", source = "listing.id")
    @Mapping(target = "guestId", source = "guest.id")
    BookingResponse toResponse(BookingEntity entity);
}
