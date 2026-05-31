package ru.itmo.pxdkxvan.lab23.search.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.search.dto.PageResponse
import ru.itmo.pxdkxvan.lab23.search.dto.VacancySearchResponse
import ru.itmo.pxdkxvan.lab23.search.service.SearchService
import java.math.BigDecimal

@RestController
class SearchController(
    private val searchService: SearchService,
) {
    @GetMapping("/vacancies")
    fun vacancies(
        @RequestParam(required = false) text: String?,
        @RequestParam(required = false) country: String?,
        @RequestParam(required = false) city: String?,
        @RequestParam(required = false) industryCode: String?,
        @RequestParam(required = false) experienceLevel: String?,
        @RequestParam(required = false) employmentType: String?,
        @RequestParam(required = false) workFormat: String?,
        @RequestParam(required = false) educationLevel: String?,
        @RequestParam(required = false) salaryFrom: BigDecimal?,
        @RequestParam(required = false) onlyWithSalary: Boolean?,
        @RequestParam(defaultValue = "relevance") sort: String,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = search(text, country, city, industryCode, experienceLevel, employmentType, workFormat, educationLevel, salaryFrom, onlyWithSalary, sort, page, limit)

    @GetMapping("/search/vacancies")
    fun search(
        @RequestParam(required = false) text: String?,
        @RequestParam(required = false) country: String?,
        @RequestParam(required = false) city: String?,
        @RequestParam(required = false) industryCode: String?,
        @RequestParam(required = false) experienceLevel: String?,
        @RequestParam(required = false) employmentType: String?,
        @RequestParam(required = false) workFormat: String?,
        @RequestParam(required = false) educationLevel: String?,
        @RequestParam(required = false) salaryFrom: BigDecimal?,
        @RequestParam(required = false) onlyWithSalary: Boolean?,
        @RequestParam(defaultValue = "relevance") sort: String,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ): PageResponse<VacancySearchResponse> = searchService.search(
        text = text,
        country = country,
        city = city,
        industryCode = industryCode,
        experienceLevel = experienceLevel,
        employmentType = employmentType,
        workFormat = workFormat,
        educationLevel = educationLevel,
        salaryFrom = salaryFrom,
        onlyWithSalary = onlyWithSalary,
        sort = sort,
        page = page,
        limit = limit,
    )
}
