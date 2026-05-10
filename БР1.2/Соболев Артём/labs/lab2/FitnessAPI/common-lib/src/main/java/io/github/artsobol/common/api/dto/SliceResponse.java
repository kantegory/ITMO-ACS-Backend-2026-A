package io.github.artsobol.common.api.dto;

import org.springframework.data.domain.Slice;

import java.util.List;

public record SliceResponse<T>(
        List<T> content,
        int page,
        int size,
        int numberOfElements,
        boolean hasNext,
        boolean first,
        boolean last
) {

    public static <T> SliceResponse<T> from(Slice<T> slice) {
        return new SliceResponse<>(
                slice.getContent(),
                slice.getNumber(),
                slice.getSize(),
                slice.getNumberOfElements(),
                slice.hasNext(),
                slice.isFirst(),
                slice.isLast()
        );
    }
}
