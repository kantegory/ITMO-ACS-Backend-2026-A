package org.rentservice.data.mapper;


import org.mapstruct.Mapper;
import org.rentservice.data.entity.Realty;
import org.rentservice.data.response.RealtyResponse;

@Mapper(
        componentModel = "spring",
        uses = {
                UserMapper.class,
                AddressMapper.class,
                PhotoMapper.class

}
)
public interface RealtyMapper
{
    RealtyResponse toResponse(Realty Realty);
}

