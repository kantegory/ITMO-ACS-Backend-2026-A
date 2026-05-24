package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.domain.entity.UserEntity;
import org.renting.rentingservice.dto.user.UpdateMeRequest;
import org.renting.rentingservice.dto.user.UserMeResponse;
import org.renting.rentingservice.dto.user.UserProfileResponse;
import org.renting.rentingservice.exception.ConflictException;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.mapper.BookingMapper;
import org.renting.rentingservice.mapper.ListingMapper;
import org.renting.rentingservice.mapper.RentMapper;
import org.renting.rentingservice.mapper.UserMapper;
import org.renting.rentingservice.repository.BookingRepository;
import org.renting.rentingservice.repository.ListingRepository;
import org.renting.rentingservice.repository.RentRepository;
import org.renting.rentingservice.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("user")
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BookingRepository bookingRepository;
    private final RentRepository rentRepository;
    private final UserMapper userMapper;
    private final ListingMapper listingMapper;
    private final BookingMapper bookingMapper;
    private final RentMapper rentMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public UserMeResponse getMe(Long userId) {
        return userMapper.toMeResponse(findUser(userId));
    }

    @Transactional
    public UserMeResponse updateMe(Long userId, UpdateMeRequest request) {
        UserEntity user = findUser(userId);
        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getPassword() != null) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("Email already in use");
            }
            user.setEmail(request.getEmail());
            user.setVerified(false);
            authService.resendVerification(userId);
        }
        return userMapper.toMeResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        UserEntity user = findUser(userId);
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .phone(user.getPhone())
                .verified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .ownedListings(listingRepository.findByOwnerId(userId).stream()
                        .map(listingMapper::toResponse)
                        .toList())
                .guestBookingHistory(bookingRepository.findByGuestId(userId).stream()
                        .map(bookingMapper::toResponse)
                        .toList())
                .guestRentHistory(rentRepository.findByGuestId(userId).stream()
                        .map(rentMapper::toResponse)
                        .toList())
                .ownerBookingHistory(bookingRepository.findByListing_Owner_Id(userId).stream()
                        .map(bookingMapper::toResponse)
                        .toList())
                .ownerRentHistory(rentRepository.findByListing_Owner_Id(userId).stream()
                        .map(rentMapper::toResponse)
                        .toList())
                .build();
    }

    private UserEntity findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
