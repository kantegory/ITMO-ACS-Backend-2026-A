package org.rentservice.data.request;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.rentservice.data.entity.OfferType;
import org.rentservice.data.entity.Realty;
import org.rentservice.data.entity.User;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ContractRequest {

    private Long realtyId;

    private Long customerId;

    private OfferType offerType;

    private Integer price;

    private String description;

    private String concluded_at;

}
