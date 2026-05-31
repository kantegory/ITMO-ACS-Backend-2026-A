package ru.itmo.pxdkxvan.lab1.vacancy.controller

import io.swagger.v3.oas.annotations.Operation
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.common.PageResponse
import ru.itmo.pxdkxvan.lab1.common.extractBracketParameters
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyCreateRequest
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyResponse
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyUpdateRequest
import ru.itmo.pxdkxvan.lab1.vacancy.service.VacancyService
import java.math.BigDecimal
import java.util.UUID

@RestController
@RequestMapping("/vacancies")
class VacancyController(
    private val vacancyService: VacancyService,
) {
    @GetMapping
    fun list(
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
        @RequestParam("salary_from", required = false) salaryFrom: BigDecimal?,
        @RequestParam("salary_to", required = false) salaryTo: BigDecimal?,
        request: HttpServletRequest,
    ): PageResponse<VacancyResponse> = vacancyService.listPublic(
        page = page,
        limit = limit,
        sort = LinkedHashMap(extractBracketParameters(request, "sort").mapValues { it.value.last() }),
        search = extractBracketParameters(request, "search"),
        salaryFrom = salaryFrom,
        salaryTo = salaryTo,
    )

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@AuthenticationPrincipal jwt: Jwt, @Valid @RequestBody request: VacancyCreateRequest): VacancyResponse =
        vacancyService.create(jwt, request)

    @GetMapping("/my")
    fun my(
        @AuthenticationPrincipal jwt: Jwt,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
        @RequestParam("salary_from", required = false) salaryFrom: BigDecimal?,
        @RequestParam("salary_to", required = false) salaryTo: BigDecimal?,
        request: HttpServletRequest,
    ): PageResponse<VacancyResponse> = vacancyService.my(
        jwt = jwt,
        page = page,
        limit = limit,
        sort = LinkedHashMap(extractBracketParameters(request, "sort").mapValues { it.value.last() }),
        search = extractBracketParameters(request, "search"),
        salaryFrom = salaryFrom,
        salaryTo = salaryTo,
    )

    @GetMapping("/{vacancyId}")
    fun get(@AuthenticationPrincipal jwt: Jwt?, @PathVariable vacancyId: UUID): VacancyResponse =
        vacancyService.getPublic(jwt, vacancyId)

    @PatchMapping("/{vacancyId}")
    fun update(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable vacancyId: UUID,
        @Valid @RequestBody request: VacancyUpdateRequest,
    ): VacancyResponse = vacancyService.update(jwt, vacancyId, request)

    @DeleteMapping("/{vacancyId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@AuthenticationPrincipal jwt: Jwt, @PathVariable vacancyId: UUID) = vacancyService.delete(jwt, vacancyId)
}
