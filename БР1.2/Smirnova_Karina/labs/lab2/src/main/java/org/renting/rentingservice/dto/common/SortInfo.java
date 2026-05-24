package org.renting.rentingservice.dto.common;

import lombok.Builder;
import lombok.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;

@Value
@Builder
public class SortInfo {
    boolean sorted;
    boolean unsorted;
    boolean empty;

    public static SortInfo from(Page<?> page) {
        Sort sort = page.getSort();
        return SortInfo.builder()
                .sorted(sort.isSorted())
                .unsorted(sort.isUnsorted())
                .empty(sort.isEmpty())
                .build();
    }
}
