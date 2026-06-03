package com.petproject.itmoacsbackend.booking.entities;

import com.petproject.itmoacsbackend.payments.entities.PaymentEntity;
import com.petproject.itmoacsbackend.property.entities.PropertyEntity;
import com.petproject.itmoacsbackend.booking.enums.BookingStatus;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Table(name = "booking")
@Entity
@NoArgsConstructor
@Getter
@Setter
@Builder
@AllArgsConstructor
public class BookingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "renter_id", nullable = false)
    private UserEntity renterId;

    @ManyToOne
    @JoinColumn(name = "property_id", nullable = false)
    private PropertyEntity propertyId;

    @OneToOne
    @JoinColumn(name = "payment_id")
    private PaymentEntity paymentId;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus bookingStatus = BookingStatus.PENDING;

    @Column(nullable = false)
    private Double totalPrice;

    private Integer guestsCount;

    private String details;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
