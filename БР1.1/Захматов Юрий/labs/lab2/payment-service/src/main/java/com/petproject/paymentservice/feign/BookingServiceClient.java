package com.petproject.paymentservice.feign;


import com.petproject.paymentservice.dto.BookingResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name="booking-service")
public interface BookingServiceClient {

    @GetMapping("/api/v1/properties/{propertyId}/bookings/{id}")
    BookingResponse getBookingById(
            @PathVariable("propertyId") Long propertyId,
            @PathVariable("id") Long id,
            @RequestHeader("Authorization") String token
            );


}
