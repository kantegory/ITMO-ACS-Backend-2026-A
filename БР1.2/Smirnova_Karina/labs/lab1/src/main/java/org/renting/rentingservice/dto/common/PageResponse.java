package org.renting.rentingservice.dto.common;

import lombok.Builder;
import lombok.Value;
import org.springframework.data.domain.Page;

import java.util.List;

@Value
@Builder
public class PageResponse<T> {
    List<T> content;
    PageableInfo pageable;
    long totalElements;
    int totalPages;
    boolean last;
    boolean first;
    int number;
    int size;
    int numberOfElements;
    boolean empty;
    SortInfo sort;

    public static <T> PageResponse<T> from(Page<?> page, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .pageable(PageableInfo.from(page))
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .number(page.getNumber())
                .size(page.getSize())
                .numberOfElements(page.getNumberOfElements())
                .empty(page.isEmpty())
                .sort(SortInfo.from(page))
                .build();
    }
}
