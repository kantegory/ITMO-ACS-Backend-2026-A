package ru.itmo.rentease.common;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ApiDtos {
    private ApiDtos() {}

    public record ErrorResponse(String code, String message, String traceId) {}
    public record HealthResponse(String status, String service) {}
    public record TokenResponse(@JsonProperty("access_token") String accessToken,
                                @JsonProperty("refresh_token") String refreshToken,
                                @JsonProperty("token_type") String tokenType) {}

    public record RegisterRequest(@Email @NotBlank String email, @Size(min = 6) @NotBlank String password,
                                  @JsonProperty("full_name") @JsonAlias("fullName") @NotBlank String fullName,
                                  @NotBlank String phone, Role role) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record UserResponse(@JsonProperty("user_id") UUID userId, String email,
                               @JsonProperty("full_name") String fullName, String phone, Role role) {}
    public record UserStatusResponse(@JsonProperty("user_id") UUID userId, boolean active, Role role) {}

    public record PropertyRequest(@NotBlank String title, @NotBlank String description,
                                  @JsonProperty("property_type") @JsonAlias("propertyType") @NotNull PropertyType propertyType,
                                  @JsonProperty("price_per_month") @JsonAlias("pricePerMonth") @NotNull @Positive BigDecimal pricePerMonth,
                                  @JsonProperty("security_deposit") @JsonAlias("securityDeposit") @PositiveOrZero BigDecimal securityDeposit,
                                  @NotBlank String city, @NotBlank String address,
                                  @JsonProperty("rooms_count") @JsonAlias("roomsCount") @PositiveOrZero Integer roomsCount,
                                  @JsonProperty("area_sqm") @JsonAlias("areaSqm") @Positive BigDecimal areaSqm) {}
    public record PropertyResponse(@JsonProperty("property_id") UUID propertyId,
                                   @JsonProperty("landlord_id") UUID landlordId, String title, String description,
                                   @JsonProperty("property_type") PropertyType propertyType,
                                   @JsonProperty("price_per_month") BigDecimal pricePerMonth,
                                   @JsonProperty("security_deposit") BigDecimal securityDeposit,
                                   String city, String address,
                                   @JsonProperty("rooms_count") Integer roomsCount,
                                   @JsonProperty("area_sqm") BigDecimal areaSqm,
                                   @JsonProperty("is_active") boolean active) {}
    public record PageResponse<T>(long total, List<T> items) {}
    public record FavoriteRequest(@JsonProperty("property_id") @JsonAlias("propertyId") @NotNull UUID propertyId) {}
    public record PropertySummary(@JsonProperty("property_id") UUID propertyId,
                                  @JsonProperty("landlord_id") UUID landlordId, boolean active,
                                  @JsonProperty("monthly_rent") BigDecimal monthlyRent) {}
    public record OwnershipResponse(@JsonProperty("property_id") UUID propertyId,
                                    @JsonProperty("landlord_id") UUID landlordId,
                                    boolean active, boolean owner) {}

    public record BookingRequest(@JsonProperty("property_id") @JsonAlias("propertyId") @NotNull UUID propertyId,
                                 @JsonProperty("start_date") @JsonAlias("startDate") @NotNull LocalDate startDate,
                                 @JsonProperty("end_date") @JsonAlias("endDate") @NotNull LocalDate endDate,
                                 String message) {}
    public record BookingStatusRequest(@NotNull BookingStatus status) {}
    public record BookingResponse(@JsonProperty("booking_id") UUID bookingId,
                                  @JsonProperty("property_id") UUID propertyId,
                                  @JsonProperty("tenant_id") UUID tenantId,
                                  @JsonProperty("landlord_id") UUID landlordId,
                                  @JsonProperty("start_date") LocalDate startDate,
                                  @JsonProperty("end_date") LocalDate endDate,
                                  BookingStatus status, String message) {}

    public record ContractCreateRequest(@JsonProperty("booking_id") @NotNull UUID bookingId,
                                        @JsonProperty("property_id") @NotNull UUID propertyId,
                                        @JsonProperty("tenant_id") @NotNull UUID tenantId,
                                        @JsonProperty("landlord_id") @NotNull UUID landlordId,
                                        @JsonProperty("monthly_rent") @NotNull @Positive BigDecimal monthlyRent) {}
    public record ContractResponse(@JsonProperty("contract_id") UUID contractId,
                                   @JsonProperty("booking_id") UUID bookingId,
                                   @JsonProperty("property_id") UUID propertyId,
                                   @JsonProperty("tenant_id") UUID tenantId,
                                   @JsonProperty("landlord_id") UUID landlordId,
                                   @JsonProperty("contract_number") String contractNumber,
                                   @JsonProperty("monthly_rent") BigDecimal monthlyRent,
                                   ContractStatus status) {}
    public record EligibilityResponse(boolean eligible, String reason) {}

    public record MessageRequest(@JsonProperty("receiver_id") @JsonAlias("receiverId") @NotNull UUID receiverId,
                                 @JsonProperty("property_id") @JsonAlias("propertyId") @NotNull UUID propertyId,
                                 @JsonProperty("message_text") @JsonAlias("messageText") @NotBlank String messageText) {}
    public record MessageResponse(@JsonProperty("message_id") UUID messageId,
                                  @JsonProperty("sender_id") UUID senderId,
                                  @JsonProperty("receiver_id") UUID receiverId,
                                  @JsonProperty("property_id") UUID propertyId,
                                  @JsonProperty("message_text") String messageText,
                                  @JsonProperty("sent_at") Instant sentAt,
                                  @JsonProperty("is_read") boolean read) {}

    public record ReviewRequest(@JsonProperty("contract_id") @JsonAlias("contractId") @NotNull UUID contractId,
                                @Min(1) @Max(5) int rating, @NotBlank String comment) {}
    public record ReviewResponse(@JsonProperty("review_id") UUID reviewId,
                                 @JsonProperty("contract_id") UUID contractId,
                                 @JsonProperty("author_id") UUID authorId,
                                 int rating, String comment) {}

    public record BookingConfirmedEvent(@JsonProperty("event_id") UUID eventId,
                                        @JsonProperty("booking_id") UUID bookingId,
                                        @JsonProperty("property_id") UUID propertyId,
                                        @JsonProperty("tenant_id") UUID tenantId,
                                        @JsonProperty("landlord_id") UUID landlordId,
                                        BookingStatus status,
                                        @JsonProperty("occurred_at") Instant occurredAt) {}

    public record NotificationResponse(@JsonProperty("notification_id") UUID notificationId,
                                       @JsonProperty("recipient_id") UUID recipientId,
                                       @JsonProperty("booking_id") UUID bookingId,
                                       String type, String message,
                                       @JsonProperty("created_at") Instant createdAt) {}
}
