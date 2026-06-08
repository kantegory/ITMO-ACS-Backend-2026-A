package org.rentservice.data.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;


@Data
@Builder
public class ContractResponse {
        private Long id;

        private RealtyResponse realty;

        private UserShortDto customer;

        private String contractType;

        private Integer price;

        private String description;

        private LocalDateTime createdAt;

        private LocalDateTime updatedAt;

        private LocalDateTime concludedAt;



}
