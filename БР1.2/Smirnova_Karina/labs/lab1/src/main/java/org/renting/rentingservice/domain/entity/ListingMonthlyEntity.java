package org.renting.rentingservice.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "listing_monthly")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingMonthlyEntity {

    @Id
    @Column(name = "listing_id")
    private Long listingId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "listing_id")
    private ListingEntity listing;

    @Column(name = "price_per_month", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerMonth;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deposit;

    @Column(name = "communal_payments", nullable = false)
    private boolean communalPayments;

    @Column(name = "min_month")
    private Integer minMonth;
}
