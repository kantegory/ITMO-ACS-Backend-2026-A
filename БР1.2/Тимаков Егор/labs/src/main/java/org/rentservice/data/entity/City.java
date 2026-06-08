package org.rentservice.data.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class City {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String cityName;
}
