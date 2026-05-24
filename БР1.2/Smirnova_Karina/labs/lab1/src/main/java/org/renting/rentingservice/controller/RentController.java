package org.renting.rentingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.renting.rentingservice.domain.enums.RentStatus;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.dto.rent.CreateRentRequest;
import org.renting.rentingservice.dto.rent.RentResponse;
import org.renting.rentingservice.dto.rent.UpdateRentRequest;
import org.renting.rentingservice.security.SecurityUtils;
import org.renting.rentingservice.service.RentService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rents")
@Tag(name = "Rents", description = "Заявки на аренду")
public class RentController {

    private final RentService rentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Создать заявку", description = "Создаёт заявку на аренду для monthly-объявления")
    public RentResponse create(@Valid @RequestBody CreateRentRequest request) {
        return rentService.create(SecurityUtils.currentUserId(), request);
    }

    @GetMapping
    @Operation(summary = "Список заявок", description = "Возвращает заявки текущего пользователя с фильтром по статусу")
    public PageResponse<RentResponse> list(
            @RequestParam(required = false) RentStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return rentService.list(SecurityUtils.currentUserId(), status, pageable);
    }

    @GetMapping("/{rentId}")
    @Operation(summary = "Детали заявки", description = "Возвращает заявку по идентификатору")
    public RentResponse get(@PathVariable Long rentId) {
        return rentService.get(rentId, SecurityUtils.currentUserId());
    }

    @PatchMapping("/{rentId}")
    @Operation(summary = "Обновить заявку", description = "Изменяет статус или способ связи в заявке")
    public RentResponse update(@PathVariable Long rentId, @Valid @RequestBody UpdateRentRequest request) {
        return rentService.update(rentId, SecurityUtils.currentUserId(), request);
    }

    @PostMapping("/{rentId}/close")
    @Operation(summary = "Закрыть заявку", description = "Помечает заявку как закрытую")
    public RentResponse close(@PathVariable Long rentId) {
        return rentService.close(rentId, SecurityUtils.currentUserId());
    }
}
