package org.rentservice.service.Realty;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.rentservice.data.entity.Address;
import org.rentservice.data.entity.Realty;
import org.rentservice.data.entity.Segment;
import org.rentservice.data.entity.User;
import org.rentservice.data.mapper.RealtyMapper;
import org.rentservice.data.request.RealtyRequest;
import org.rentservice.data.request.UpdateRealtyRequest;
import org.rentservice.data.response.RealtyResponse;
import org.rentservice.repository.AddressRepository;
import org.rentservice.repository.RealtyRepository;
import org.rentservice.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;


import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RealtyServiceImpl
        implements RealtyService {

    private final RealtyRepository realtyRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final RealtyMapper realtyMapper;

    @Override
    public RealtyResponse create(
            RealtyRequest request
    ) {

        User owner = getCurrentUser();

        Address address =
                addressRepository.findById(
                                request.getAddressId())
                        .orElseThrow(
                                () -> new EntityNotFoundException(
                                        "Address not found"));

        Realty realty = Realty.builder()
                .owner(owner)
                .address(address)
                .segment(
                        Segment.valueOf(
                                request.getRealtyClass()
                        )
                )
                .isRenovated(request.getRenovated())
                .isDishwasher(request.getDishwasher())
                .isKitchen(request.getKitchen())
                .isBalcony(request.getBalcony())
                .totalRooms(request.getTotalRooms())
                .totalBathrooms(request.getTotalBathrooms())
                .totalBedrooms(request.getTotalBedrooms())
                .build();

        return realtyMapper.toResponse(
                realtyRepository.save(realty)
        );
    }

    @Override
    public RealtyResponse getById(Long id) {

        Realty realty =
                realtyRepository.findById(id)
                        .orElseThrow(
                                () -> new EntityNotFoundException(
                                        "Realty not found"));

        return realtyMapper.toResponse(realty);
    }

    @Override
    public List<RealtyResponse> getAll() {

        return realtyRepository.findAll()
                .stream()
                .map(realtyMapper::toResponse)
                .toList();
    }

    @Override
    public RealtyResponse update(
            Long id,
            UpdateRealtyRequest request
    ) {

        Realty realty =
                realtyRepository.findById(id)
                        .orElseThrow(
                                () -> new EntityNotFoundException(
                                        "Realty not found"));

        realty.setSegment(request.getRealtySegment());
        realty.setIsRenovated(request.getRenovated());
        realty.setIsDishwasher(request.getDishwasher());
        realty.setIsKitchen(request.getKitchen());
        realty.setIsBalcony(request.getBalcony());
        realty.setTotalRooms(request.getTotalRooms());
        realty.setTotalBathrooms(request.getTotalBathrooms());
        realty.setTotalBedrooms(request.getTotalBedrooms());

        return realtyMapper.toResponse(
                realtyRepository.save(realty)
        );
    }

    @Override
    public void delete(Long id) {

        realtyRepository.deleteById(id);
    }

    private User getCurrentUser() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();


        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Current user not found"));
    }
}




