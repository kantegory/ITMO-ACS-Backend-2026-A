package ru.itmo.rentease.common;

public final class MessagingConstants {
    private MessagingConstants() {}

    public static final String EXCHANGE = "rentease.events";
    public static final String BOOKING_CONFIRMED_QUEUE = "communication.booking-confirmed";
    public static final String BOOKING_CONFIRMED_KEY = "booking.confirmed";
}
