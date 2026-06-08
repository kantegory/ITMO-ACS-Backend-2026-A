package org.rentservice.service.auth;

import org.rentservice.data.request.UserLoginRequest;
import org.rentservice.data.request.UserRegisterRequest;
import org.rentservice.data.response.JwtResponse;

public interface AuthService {


    JwtResponse register(
            UserRegisterRequest request
    );

    JwtResponse login(
            UserLoginRequest request
    );



}
