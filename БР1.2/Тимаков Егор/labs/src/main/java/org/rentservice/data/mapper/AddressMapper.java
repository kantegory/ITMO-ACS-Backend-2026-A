package org.rentservice.data.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.rentservice.data.entity.Address;
import org.rentservice.data.response.AddressResponse;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(target = "cityName",
            source = "city.cityName"
    )
    AddressResponse toResponse(Address address);

}
