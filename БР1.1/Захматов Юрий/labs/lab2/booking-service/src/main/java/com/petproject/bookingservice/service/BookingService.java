package com.petproject.bookingservice.service;


import com.petproject.bookingservice.dto.BookingCreateRequest;
import com.petproject.bookingservice.dto.BookingResponse;
import com.petproject.bookingservice.dto.PaymentResponse;
import com.petproject.bookingservice.dto.SetPaymentIdEvent;
import com.petproject.bookingservice.entities.BookingEntity;
import com.petproject.bookingservice.enums.BookingStatus;
import com.petproject.bookingservice.feign.PaymentServiceClient;
import com.petproject.bookingservice.feign.PropertyServiceClient;
import com.petproject.bookingservice.repositories.BookingRepository;
import com.petproject.bookingservice.security.JwtPrincipal;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PropertyServiceClient propertyServiceClient;
    private final PaymentServiceClient paymentServiceClient;

    @Transactional
    public BookingResponse createBooking(
            Long propertyId,
            BookingCreateRequest request,
            JwtPrincipal user
    ) {
        Boolean propertyExists = propertyServiceClient.ifExists(propertyId);
        if (!propertyExists) {

            throw new EntityNotFoundException("No such entity with id:" + propertyId);

        }

        var bookingToCreate = BookingEntity.builder()
                                           .renterId(user.userId())
                                           .propertyId(propertyId)
                                           .startDate(request.startDate())
                                           .endDate(request.endDate())
                                           .bookingStatus(BookingStatus.PENDING)
                                           .totalPrice(request.totalPrice())
                                           .guestsCount(request.guestsCount())
                                           .details(request.details())
                                           .build();

        var savedBooking = bookingRepository.save(bookingToCreate);

        return mapToResponse(savedBooking);
    }

    public Page<BookingResponse> getAllBookings(
            Long propertyId,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").descending());

        Boolean propertyExists = propertyServiceClient.ifExists(propertyId);
        if (!propertyExists) {
            throw new EntityNotFoundException("No such entity with id:" + propertyId);
        }
        Page<BookingEntity> entities =  bookingRepository.findByPropertyId(propertyId, pageable);

        return entities.map(this::mapToResponse);
    }

    public BookingResponse getBookingById(Long propertyId, Long bookingId, JwtPrincipal user) {
        Boolean propertyExists = propertyServiceClient.ifExists(propertyId);
        if (!propertyExists) {
            throw new EntityNotFoundException("No such entity with id:" + propertyId);
        }
        BookingEntity booking = bookingRepository.findById(bookingId).orElseThrow(
                () -> new EntityNotFoundException("No such booking with id:" + bookingId)
        );

        if (!user.userId().equals(booking.getRenterId())) {
            throw new SecurityException("You are not allowed to perform this action");
        }

        return mapToResponse(booking);
    }


    private BookingResponse mapToResponse(BookingEntity booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .renterId(booking.getRenterId())
                .propertyId(booking.getPropertyId())
                .paymentInfo(booking.getPaymentId() != null ?
                        fetchPaymentInfo(booking.getPropertyId(), booking.getId(), booking.getPaymentId()) : null) // добавить сюда вызов на этот эедпоинт
                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .status(booking.getBookingStatus())
                .totalPrice(booking.getTotalPrice())
                .guestsCount(booking.getGuestsCount())
                .details(booking.getDetails())
                .createdAt(booking.getCreatedAt())
                .build();
    }

    private PaymentResponse fetchPaymentInfo(Long propertyId, Long bookingId, Long paymentId) {
        String token = getTokenFromContext();
        log.info("Fetching payment info with token: {}", token != null ? "present" : "null");
        return paymentServiceClient.getPaymentById(propertyId, bookingId, paymentId, token);
    }

    @Transactional
    public BookingResponse cancelBooking(Long id, JwtPrincipal user) {
        BookingEntity booking = bookingRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("No such booking with id:" + id)
        );

        if (!user.equals(booking.getRenterId())) {
            throw new SecurityException("You are not allowed to perform this action");
        }

        booking.setBookingStatus(BookingStatus.CANCELLED);
        var saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse confirmBooking(Long id, JwtPrincipal user) {
        BookingEntity booking = bookingRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("No such booking with id:" + id)
        );

        Boolean propertyExists = propertyServiceClient.ifExists(booking.getPropertyId());
        if (!propertyExists) {
            throw new EntityNotFoundException("No such entity with id:" + booking.getPropertyId());
        }

        Long ownerId = propertyServiceClient.getOwnerId(booking.getPropertyId());

        if (!user.userId().equals(ownerId)) {
            throw new SecurityException("You are not allowed to perform this action");
        }

        if (booking.getBookingStatus().equals(BookingStatus.CANCELLED)) {
            throw new SecurityException("Booking cancelled by renter");
        }

        String token = getTokenFromContext();

        paymentServiceClient.createPayment(booking.getPropertyId(), booking.getId(), token);

        booking.setBookingStatus(BookingStatus.CONFIRMED);
        var saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    private String getTokenFromContext() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getCredentials() != null) {
            String token = (String) auth.getCredentials();
            return token.startsWith("Bearer ") ? token : "Bearer " + token;
        }
        log.error("No token found in SecurityContext");
        return null;
    }

    @Transactional
    public BookingResponse rejectBooking(Long id, JwtPrincipal user) {
        BookingEntity booking = bookingRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("No such booking with id:" + id)
        );

        Boolean propertyExists = propertyServiceClient.ifExists(booking.getPropertyId());
        if (!propertyExists) {
            throw new EntityNotFoundException("No such entity with id:" + booking.getPropertyId());
        }

        Long ownerId = propertyServiceClient.getOwnerId(booking.getPropertyId());

        if (!user.userId().equals(ownerId)) {
            throw new SecurityException("You are not allowed to perform this action");
        }
        booking.setBookingStatus(BookingStatus.REJECTED);
        var saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    public BookingResponse completeBooking(Long id, JwtPrincipal user) {
        BookingEntity booking = bookingRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("No such booking with id:" + id)
        );

        Boolean propertyExists = propertyServiceClient.ifExists(booking.getPropertyId());
        if (!propertyExists) {
            throw new EntityNotFoundException("No such entity with id:" + booking.getPropertyId());
        }

        Long ownerId = propertyServiceClient.getOwnerId(booking.getPropertyId());

        if (!user.userId().equals(ownerId)) {
            throw new SecurityException("You are not allowed to perform this action");
        }

        if (booking.getEndDate().isAfter(LocalDate.now())) {
            throw new SecurityException("You can't complete booking before end date, if you want, connect administration");
        }

        booking.setBookingStatus(BookingStatus.COMPLETED);
        var saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    public Page<BookingResponse> getAllUserBookings(JwtPrincipal user, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BookingEntity> properties = bookingRepository.findAllByRenterId(user.userId(), pageable);
        return properties.map(this::mapToResponse);

    }

    @KafkaListener(topics = "payment.status.updated", groupId = "booking-service-group")
    public void setPaymentId(@Payload SetPaymentIdEvent payload) {
        log.info("Received setPaymentId for booking {} and paymentId {}", payload.bookingId(), payload.paymentId());

        Long bookingId = payload.bookingId();
        Long paymentId = payload.paymentId();

        BookingEntity booking = bookingRepository.findById(bookingId).orElseThrow(
                () -> new EntityNotFoundException("No such booking with id:" + bookingId)
        );

        booking.setPaymentId(paymentId);

        bookingRepository.save(booking);

        log.info("Booking with id:{} has been set", bookingId);
    }

}
