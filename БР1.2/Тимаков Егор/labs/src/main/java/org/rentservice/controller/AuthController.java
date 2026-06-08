package org.rentservice.controller;


import lombok.RequiredArgsConstructor;
import org.rentservice.data.request.UserLoginRequest;
import org.rentservice.data.request.UserRegisterRequest;
import org.rentservice.data.response.JwtResponse;
import org.rentservice.service.auth.AuthService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public JwtResponse register(
            @RequestBody
            UserRegisterRequest request
    ) {

        return authService.register(
                request
        );
    }

    @PostMapping("/login")
    public JwtResponse login(
            @RequestBody
            UserLoginRequest request
    ) {

        return authService.login(
                request
        );
    }
}
