package ru.itmo.rentease;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import ru.itmo.rentease.Domain.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ApiDtos {
    private ApiDtos() {}

    public record ErrorResponse(String code, String message) {}
    public record HealthResponse(String status) {}
    public record TokenResponse(@JsonProperty("access_token") String accessToken,
                                @JsonProperty("refresh_token") String refreshToken,
                                @JsonProperty("token_type") String tokenType) {}

    public record RegisterRequest(@Email @NotBlank String email, @Size(min = 6) @NotBlank String password,
                                  @JsonProperty("full_name") @JsonAlias("fullName") @NotBlank String fullName,
                                  @NotBlank String phone, Role role) {}

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record UserResponse(@JsonProperty("user_id") UUID userId, String email,
                               @JsonProperty("full_name") String fullName, String phone, Role role) {
        public static UserResponse from(Account account) {
            return new UserResponse(account.id, account.email, account.fullName, account.phone, account.role.name);
        }
    }

    public record PropertyRequest(@NotBlank String title, @NotBlank String description,
                                  @JsonProperty("property_type") @JsonAlias("propertyType") @NotNull PropertyType propertyType,
                                  @JsonProperty("price_per_month") @JsonAlias("pricePerMonth") @NotNull @Positive BigDecimal pricePerMonth,
                                  @JsonProperty("security_deposit") @JsonAlias("securityDeposit") @PositiveOrZero BigDecimal securityDeposit,
                                  @NotBlank String city, @NotBlank String address,
                                  @JsonProperty("rooms_count") @JsonAlias("roomsCount") @PositiveOrZero Integer roomsCount,
                                  @JsonProperty("area_sqm") @JsonAlias("areaSqm") @Positive BigDecimal areaSqm) {}

    public record PropertyResponse(@JsonProperty("property_id") UUID propertyId,
                                   @JsonProperty("landlord_id") UUID landlordId,
                                   String title, String description,
                                   @JsonProperty("property_type") PropertyType propertyType,
                                   @JsonProperty("price_per_month") BigDecimal pricePerMonth,
                                   @JsonProperty("security_deposit") BigDecimal securityDeposit,
                                   String city, String address,
                                   @JsonProperty("rooms_count") Integer roomsCount,
                                   @JsonProperty("area_sqm") BigDecimal areaSqm,
                                   @JsonProperty("is_active") boolean isActive) {
        public static PropertyResponse from(Property property) {
            return new PropertyResponse(property.id, property.landlord.id, property.title, property.description,
                    property.propertyType, property.pricePerMonth, property.securityDeposit, property.city,
                    property.address, property.roomsCount, property.areaSqm, property.isActive);
        }
    }

    public record PageResponse<T>(long total, List<T> items) {}
    public record FavoriteRequest(@JsonProperty("property_id") @JsonAlias("propertyId") @NotNull UUID propertyId) {}
    public record BookingRequest(@JsonProperty("property_id") @JsonAlias("propertyId") @NotNull UUID propertyId,
                                 @JsonProperty("start_date") @JsonAlias("startDate") @NotNull LocalDate startDate,
                                 @JsonProperty("end_date") @JsonAlias("endDate") @NotNull LocalDate endDate,
                                 String message) {}
    public record BookingStatusRequest(@NotNull BookingStatus status) {}

    public record BookingResponse(@JsonProperty("booking_id") UUID bookingId,
                                  @JsonProperty("property_id") UUID propertyId,
                                  @JsonProperty("tenant_id") UUID tenantId,
                                  @JsonProperty("start_date") LocalDate startDate,
                                  @JsonProperty("end_date") LocalDate endDate,
                                  BookingStatus status, String message) {
        public static BookingResponse from(Booking booking) {
            return new BookingResponse(booking.id, booking.property.id, booking.tenant.id, booking.startDate,
                    booking.endDate, booking.status, booking.message);
        }
    }

    public record MessageRequest(@JsonProperty("receiver_id") @JsonAlias("receiverId") @NotNull UUID receiverId,
                                 @JsonProperty("property_id") @JsonAlias("propertyId") @NotNull UUID propertyId,
                                 @JsonProperty("message_text") @JsonAlias("messageText") @NotBlank String messageText) {}

    public record MessageResponse(@JsonProperty("message_id") UUID messageId,
                                  @JsonProperty("sender_id") UUID senderId,
                                  @JsonProperty("receiver_id") UUID receiverId,
                                  @JsonProperty("property_id") UUID propertyId,
                                  @JsonProperty("message_text") String messageText,
                                  @JsonProperty("sent_at") Instant sentAt,
                                  @JsonProperty("is_read") boolean isRead) {
        public static MessageResponse from(Message message) {
            return new MessageResponse(message.id, message.sender.id, message.receiver.id, message.property.id,
                    message.messageText, message.sentAt, message.isRead);
        }
    }

    public record ContractResponse(@JsonProperty("contract_id") UUID contractId,
                                   @JsonProperty("booking_id") UUID bookingId,
                                   @JsonProperty("contract_number") String contractNumber,
                                   @JsonProperty("monthly_rent") BigDecimal monthlyRent,
                                   ContractStatus status) {
        public static ContractResponse from(RentalContract contract) {
            return new ContractResponse(contract.id, contract.booking.id, contract.contractNumber,
                    contract.monthlyRent, contract.status);
        }
    }

    public record ReviewRequest(@JsonProperty("contract_id") @JsonAlias("contractId") @NotNull UUID contractId,
                                @Min(1) @Max(5) int rating, @NotBlank String comment) {}

    public record ReviewResponse(@JsonProperty("review_id") UUID reviewId,
                                 @JsonProperty("contract_id") UUID contractId,
                                 @JsonProperty("author_id") UUID authorId,
                                 int rating, String comment) {
        public static ReviewResponse from(Review review) {
            return new ReviewResponse(review.id, review.contract.id, review.author.id, review.rating, review.comment);
        }
    }
}
