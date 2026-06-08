package org.rentservice.service.Address;

import lombok.RequiredArgsConstructor;
import org.rentservice.data.entity.Address;
import org.rentservice.data.entity.City;
import org.rentservice.data.mapper.AddressMapper;
import org.rentservice.data.request.AddressRequest;
import org.rentservice.data.response.AddressResponse;
import org.rentservice.repository.AddressRepository;
import org.rentservice.repository.CityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AddressServiceImpl
        implements AddressService {

    private final AddressRepository addressRepository;
    private final CityRepository cityRepository;
    private final AddressMapper addressMapper;

    @Override
    public AddressResponse create(
            AddressRequest request
    ) {

        City city = cityRepository.findById(
                        request.getCityId())
                .orElseThrow();

        Address address = new Address();

        address.setCity(city);
        address.setStreet(request.getStreet());
        address.setBuildingNumber(
                request.getBuildingNumber());

        return addressMapper.toResponse(
                addressRepository.save(address)
        );
    }

    @Override
    public AddressResponse getById(Long id) {

        return addressMapper.toResponse(
                addressRepository.findById(id)
                        .orElseThrow()
        );
    }

    @Override
    public List<AddressResponse> getAll() {

        return addressRepository.findAll()
                .stream()
                .map(addressMapper::toResponse)
                .toList();
    }

    @Override
    public void delete(Long id) {

        addressRepository.deleteById(id);
    }
}