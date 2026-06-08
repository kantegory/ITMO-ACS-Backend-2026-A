package org.rentservice.service.auth;

import lombok.RequiredArgsConstructor;
import org.rentservice.data.entity.Role;
import org.rentservice.data.entity.User;
import org.rentservice.data.request.UserLoginRequest;
import org.rentservice.data.request.UserRegisterRequest;
import org.rentservice.data.response.JwtResponse;
import org.rentservice.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl
        implements AuthService {

    private final UserRepository userRepository;

    private final PasswordEncoder
            passwordEncoder;

    private final AuthenticationManager
            authenticationManager;

    private final JwtService jwtService;

    @Override
    public JwtResponse register(
            UserRegisterRequest request
    ) {

        if (userRepository.existsByEmail(
                request.getEmail()
        )) {

            throw new RuntimeException(
                    "Email already exists"
            );
        }

        User user = new User();

        user.setEmail(
                request.getEmail()
        );

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setFirstName(
                request.getFirstName()
        );

        user.setLastName(
                request.getLastName()
        );

        user.setMiddleName(
                request.getMiddleName()
        );

        user.setRole(Role.User);

        user.setIs_verified(false);

        user.setCreated_at(
                new Date()
        );

        userRepository.save(user);

        String token =
                jwtService.generateToken(
                        user.getEmail()
                );

        return JwtResponse.builder()
                .accessToken(token)
                .refreshToken(token)
                .build();
    }

    @Override
    public JwtResponse login(
            UserLoginRequest request
    ) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        String token =
                jwtService.generateToken(
                        request.getEmail()
                );

        return JwtResponse.builder()
                .accessToken(token)
                .refreshToken(token)
                .build();
    }
}
