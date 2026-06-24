package io.github.artsobol.fitnessapi.api.common.dto;

import org.springframework.data.domain.Slice;

import java.util.List;

public record SliceResponse<T>(
        List<T> content,
        int page,
        int size,
        boolean hasNext
) {
    public static <T> SliceResponse<T> from(Slice<T> slice) {
        return new SliceResponse<>(
                slice.getContent(),
                slice.getNumber(),
                slice.getSize(),
                slice.hasNext()
        );
    }
}
