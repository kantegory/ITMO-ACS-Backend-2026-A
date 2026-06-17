package org.renting.rentingservice.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "listing_daily")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingDailyEntity {

    @Id
    @Column(name = "listing_id")
    private Long listingId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "listing_id")
    private ListingEntity listing;

    @Column(name = "price_per_night", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerNight;

    @Column(name = "min_nights", nullable = false)
    private int minNights;

    @Column(name = "max_nights")
    private Integer maxNights;

    @Column(name = "check_in_time", length = 16)
    private String checkInTime;

    @Column(name = "check_out_time", length = 16)
    private String checkOutTime;
}
