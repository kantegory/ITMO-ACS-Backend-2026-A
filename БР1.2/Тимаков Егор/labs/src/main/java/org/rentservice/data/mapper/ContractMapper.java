package org.rentservice.data.mapper;

import org.mapstruct.Mapper;
import org.rentservice.data.entity.Contract;
import org.rentservice.data.response.ContractResponse;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {
                UserMapper.class,
                RealtyMapper.class
        }
)
public interface ContractMapper {
    ContractResponse toResponse(Contract contract);
    List<ContractResponse> toResponseList(List<Contract> contracts);
}
