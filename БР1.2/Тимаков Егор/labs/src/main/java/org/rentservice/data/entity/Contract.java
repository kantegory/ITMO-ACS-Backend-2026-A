package org.rentservice.data.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;

@Data
@Entity
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Realty realty;

    @ManyToOne
    private User customer;

    @Enumerated(EnumType.STRING)
    private OfferType offerType;

    @Column
    private Integer price;

    @Column
    private String description;

    @Column
    private Date created_at;

    @Column
    private Date updated_at;

    @Column
    private Date concluded_at;

}
