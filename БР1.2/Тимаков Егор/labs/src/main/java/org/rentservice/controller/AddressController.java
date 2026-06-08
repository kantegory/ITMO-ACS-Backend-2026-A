package org.rentservice.controller;


import lombok.RequiredArgsConstructor;
import org.rentservice.data.request.AddressRequest;
import org.rentservice.data.response.AddressResponse;
import org.rentservice.service.Address.AddressService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @PostMapping
    public AddressResponse create(
            @RequestBody AddressRequest request
    ) {
        return addressService.create(request);
    }

    @GetMapping("/{id}")
    public AddressResponse getById(
            @PathVariable Long id
    ) {
        return addressService.getById(id);
    }

    @GetMapping
    public List<AddressResponse> getAll() {
        return addressService.getAll();
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {
        addressService.delete(id);
    }
}
