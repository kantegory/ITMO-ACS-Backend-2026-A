package org.rentservice.controller;


import lombok.RequiredArgsConstructor;
import org.rentservice.data.request.UserUpdateRequest;
import org.rentservice.data.response.UserResponse;
import org.rentservice.service.User.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public UserResponse getById(
            @PathVariable Long id
    ) {
        return userService.getById(id);
    }

    @GetMapping
    public List<UserResponse> getAll() {
        return userService.getAll();
    }

    @PutMapping("/{id}")
    public UserResponse update(
            @PathVariable Long id,
            @RequestBody UserUpdateRequest request
    ) {
        return userService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {
        userService.delete(id);
    }
}