package org.rentservice.data.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum Segment{

    Business("Business"),
    Economy("Economy"),
    Standard("Standard"),
    Commerce("Commerce");

    private final String value;

    Segment(String value) {
        this.value = value;
    }


    public String getValue() {
        return value;
    }

    @JsonCreator
    public static Segment fromString(String text) {
        for (Segment segment : Segment.values()) {
            if (segment.value.equalsIgnoreCase(text)) {
                return segment;
            }
        }
        throw new IllegalArgumentException("Неизвестное значение: " + text);
    }
    }

