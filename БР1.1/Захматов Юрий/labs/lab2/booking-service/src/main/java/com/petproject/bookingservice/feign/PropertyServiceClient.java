package com.petproject.bookingservice.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name="property-service")
public interface PropertyServiceClient {

    @GetMapping("/api/v1/properties/{id}/is_exists")
    Boolean ifExists(@PathVariable("id") Long propertyId);

    @GetMapping("/api/v1/properties/{id}/owner")
    Long getOwnerId(@PathVariable("id") Long propertyId);

}
