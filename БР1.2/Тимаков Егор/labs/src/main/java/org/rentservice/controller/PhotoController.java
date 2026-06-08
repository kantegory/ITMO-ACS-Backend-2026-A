package org.rentservice.controller;


import lombok.RequiredArgsConstructor;
import org.rentservice.data.request.PhotoRequest;
import org.rentservice.data.response.PhotoResponse;
import org.rentservice.service.Photo.PhotoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @PostMapping
    public PhotoResponse create(
            @RequestBody PhotoRequest request
    ) {
        return photoService.create(request);
    }

    @GetMapping("/realty/{realtyId}")
    public List<PhotoResponse> getByRealty(
            @PathVariable Long realtyId
    ) {
        return photoService.getByRealty(realtyId);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {
        photoService.delete(id);
    }
}
