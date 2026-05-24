package org.renting.rentingservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.renting.rentingservice.domain.entity.RentEntity;
import org.renting.rentingservice.dto.rent.RentResponse;

@Mapper(componentModel = "spring")
public interface RentMapper {

    @Mapping(target = "listingId", source = "listing.id")
    @Mapping(target = "guestId", source = "guest.id")
    RentResponse toResponse(RentEntity entity);
}
