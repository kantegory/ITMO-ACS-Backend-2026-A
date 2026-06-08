package org.rentservice.controller;


import lombok.RequiredArgsConstructor;
import org.rentservice.data.request.RealtyRequest;
import org.rentservice.data.request.UpdateRealtyRequest;
import org.rentservice.data.response.RealtyResponse;
import org.rentservice.service.Realty.RealtyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/realties")
@RequiredArgsConstructor
public class RealtyController {

    private final RealtyService realtyService;

    @PostMapping
    public RealtyResponse create(
            @RequestBody RealtyRequest request
    ) {
        return realtyService.create(request);
    }

    @GetMapping("/{id}")
    public RealtyResponse getById(
            @PathVariable Long id
    ) {
        return realtyService.getById(id);
    }

    @GetMapping
    public List<RealtyResponse> getAll() {
        return realtyService.getAll();
    }

    @PutMapping("/{id}")
    public RealtyResponse update(
            @PathVariable Long id,
            @RequestBody UpdateRealtyRequest request
    ) {
        return realtyService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {
        realtyService.delete(id);
    }
}
