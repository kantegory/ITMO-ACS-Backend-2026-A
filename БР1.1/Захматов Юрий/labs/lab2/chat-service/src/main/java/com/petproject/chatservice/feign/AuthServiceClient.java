package com.petproject.chatservice.feign;

import com.petproject.chatservice.dto.UserShortResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@FeignClient(name="auth-service")
public interface AuthServiceClient {
    @GetMapping("/api/v1/users/me/{user_id}")
    UserShortResponse getUserById(@PathVariable("user_id") Long userId);

}
