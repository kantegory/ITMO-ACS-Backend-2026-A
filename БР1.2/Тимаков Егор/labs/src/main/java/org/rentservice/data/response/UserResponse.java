package org.rentservice.data.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponse {

        private Long id;

        private String firstName;

        private String lastName;

        private String middleName;

        private String email;

        private String role;

        private Boolean isVerified;

        private LocalDateTime createdAt;
    }
