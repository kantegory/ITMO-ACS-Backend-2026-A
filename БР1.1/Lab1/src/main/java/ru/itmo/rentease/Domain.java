package ru.itmo.rentease;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class Domain {
    private Domain() {}
    public enum Role { tenant, landlord, admin }
    public enum PropertyType { apartment, house, room, commercial }
    public enum BookingStatus { pending, confirmed, cancelled, completed }
    public enum ContractStatus { active, completed, cancelled }
    public enum PaymentStatus { pending, paid, cancelled }

    @MappedSuperclass
    public abstract static class Identified {
        @Id public UUID id = UUID.randomUUID();
    }
    @Entity(name = "UserRole") @Table(name = "user_roles")
    public static class UserRole {
        @Id @Enumerated(EnumType.STRING) public Role name;
    }
    @Entity(name = "Account") @Table(name = "users")
    public static class Account extends Identified {
        @Column(nullable = false, unique = true) public String email;
        @Column(nullable = false) public String passwordHash;
        @Column(nullable = false) public String fullName;
        @Column(nullable = false) public String phone;
        @ManyToOne(optional = false) @JoinColumn(name = "role") public UserRole role;
    }
    @Entity(name = "Property") @Table(name = "properties")
    public static class Property extends Identified {
        @ManyToOne(optional = false) public Account landlord;
        @Column(nullable = false) public String title;
        @Column(nullable = false, length = 10000) public String description;
        @Enumerated(EnumType.STRING) @Column(nullable = false) public PropertyType propertyType;
        @Column(nullable = false, precision = 14, scale = 2) public BigDecimal pricePerMonth;
        @Column(nullable = false, precision = 14, scale = 2) public BigDecimal securityDeposit = BigDecimal.ZERO;
        @Column(nullable = false) public String city;
        @Column(nullable = false) public String address;
        public Integer roomsCount;
        @Column(precision = 12, scale = 2) public BigDecimal areaSqm;
        @Column(nullable = false) public boolean isActive = true;
    }
    @Entity(name = "RentalCondition") @Table(name = "rental_conditions")
    public static class RentalCondition extends Identified {
        @OneToOne(optional = false) public Property property;
        public int minimumMonths = 1;
        public boolean utilitiesIncluded;
        public boolean petsAllowed;
        @Column(length = 2000) public String notes;
    }
    @Entity(name = "PropertyPhoto") @Table(name = "property_photos")
    public static class PropertyPhoto extends Identified {
        @ManyToOne(optional = false) public Property property;
        @Column(nullable = false) public String contentType;
        @Column(nullable = false) public byte[] content;
    }
    @Entity(name = "Favorite") @Table(name = "favorites", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "property_id"}))
    public static class Favorite extends Identified {
        @ManyToOne(optional = false) @JoinColumn(name = "user_id") public Account user;
        @ManyToOne(optional = false) public Property property;
    }
    @Entity(name = "Booking") @Table(name = "bookings")
    public static class Booking extends Identified {
        @ManyToOne(optional = false) public Account tenant;
        @ManyToOne(optional = false) public Property property;
        @Column(nullable = false) public LocalDate startDate;
        @Column(nullable = false) public LocalDate endDate;
        @Enumerated(EnumType.STRING) @Column(nullable = false) public BookingStatus status = BookingStatus.pending;
        @Column(length = 4000) public String message;
    }
    @Entity(name = "RentalContract") @Table(name = "rental_contracts")
    public static class RentalContract extends Identified {
        @OneToOne(optional = false) public Booking booking;
        @Column(nullable = false, unique = true) public String contractNumber;
        @Column(nullable = false, precision = 14, scale = 2) public BigDecimal monthlyRent;
        @Enumerated(EnumType.STRING) @Column(nullable = false) public ContractStatus status = ContractStatus.active;
    }
    @Entity(name = "Payment") @Table(name = "payments")
    public static class Payment extends Identified {
        @ManyToOne(optional = false) public RentalContract contract;
        @Column(nullable = false, precision = 14, scale = 2) public BigDecimal amount;
        @Enumerated(EnumType.STRING) @Column(nullable = false) public PaymentStatus status = PaymentStatus.pending;
    }
    @Entity(name = "Message") @Table(name = "messages")
    public static class Message extends Identified {
        @ManyToOne(optional = false) public Account sender;
        @ManyToOne(optional = false) public Account receiver;
        @ManyToOne(optional = false) public Property property;
        @Column(nullable = false, length = 4000) public String messageText;
        @Column(nullable = false) public Instant sentAt = Instant.now();
        @Column(nullable = false) public boolean isRead;
    }
    @Entity(name = "Review") @Table(name = "reviews", uniqueConstraints = @UniqueConstraint(columnNames = {"contract_id", "author_id"}))
    public static class Review extends Identified {
        @ManyToOne(optional = false) public RentalContract contract;
        @ManyToOne(optional = false) public Account author;
        public int rating;
        @Column(nullable = false, length = 4000) public String comment;
    }
}
