package com.petproject.itmoacsbackend.property.entities;


import jakarta.persistence.*;
import lombok.*;

@Table(name = "amenity")
@Entity
@NoArgsConstructor
@Getter
@Setter
@Builder
@AllArgsConstructor
public class AmenityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false,  unique = true)
    private String name;
}
