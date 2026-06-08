package org.rentservice.data.mapper;

import org.mapstruct.Mapper;
import org.rentservice.data.entity.City;
import org.rentservice.data.response.CityResponse;

@Mapper(componentModel = "spring")
public interface CityMapper {

    CityResponse toResponse(City city);
}
