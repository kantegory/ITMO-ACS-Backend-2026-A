package org.renting.rentingservice.domain.enums;

/** OpenAPI payment statuses (ERD REFUNDED is not used). */
public enum PaymentStatus {
    NEW,
    SUCCESS,
    CANCELED,
    FAILED
}
