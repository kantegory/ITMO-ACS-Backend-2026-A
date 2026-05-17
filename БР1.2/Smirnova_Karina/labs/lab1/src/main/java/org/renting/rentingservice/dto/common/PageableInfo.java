package org.renting.rentingservice.dto.common;

import lombok.Builder;
import lombok.Value;
import org.springframework.data.domain.Page;

@Value
@Builder
public class PageableInfo {
    int pageNumber;
    int pageSize;
    long offset;
    boolean paged;
    boolean unpaged;
    SortInfo sort;

    public static PageableInfo from(Page<?> page) {
        return PageableInfo.builder()
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .offset(page.getPageable().getOffset())
                .paged(page.getPageable().isPaged())
                .unpaged(page.getPageable().isUnpaged())
                .sort(SortInfo.from(page))
                .build();
    }
}
