package org.renting.rentingservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.renting.rentingservice.domain.entity.*;
import org.renting.rentingservice.dto.listing.*;
import org.renting.rentingservice.util.GeoUtils;

@Mapper(componentModel = "spring", imports = GeoUtils.class)
public interface ListingMapper {

    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "lat", expression = "java(GeoUtils.latitude(entity.getLocation()))")
    @Mapping(target = "lng", expression = "java(GeoUtils.longitude(entity.getLocation()))")
    @Mapping(target = "isActive", source = "active")
    ListingResponse toResponse(ListingEntity entity);

    @Mapping(target = "listingId", source = "listingId")
    ListingDailyResponse toDailyResponse(ListingDailyEntity entity);

    @Mapping(target = "listingId", source = "listingId")
    ListingMonthlyResponse toMonthlyResponse(ListingMonthlyEntity entity);

    @Mapping(target = "listingId", source = "listing.id")
    @Mapping(target = "isMain", source = "main")
    PhotoResponse toPhotoResponse(ListingPhotoEntity entity);
}
