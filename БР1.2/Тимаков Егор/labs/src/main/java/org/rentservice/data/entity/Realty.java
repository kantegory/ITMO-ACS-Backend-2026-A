package org.rentservice.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Realty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User owner;

    @Enumerated(EnumType.STRING)
    private Segment segment;

    @ManyToOne
    private Address address;

    @Column
    private Boolean isRenovated;

    @Column
    private Boolean isDishwasher;

    @Column
    private Boolean isKitchen;

    @Column
    private Boolean isBalcony;

    @Column
    private String totalRooms;

    @Column
    private String totalBathrooms;

    @Column
    private String totalBedrooms;

}
