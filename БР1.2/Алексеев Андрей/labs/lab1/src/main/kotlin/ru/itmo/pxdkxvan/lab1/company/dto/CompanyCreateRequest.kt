package ru.itmo.pxdkxvan.lab1.company.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Digits
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.math.BigDecimal

data class CompanyCreateRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val title: String,
    val description: String? = null,
    @field:Size(max = 255)
    val website: String? = null,
    @field:Size(max = 255)
    val industryHint: String? = null,
    @field:Size(max = 255)
    val address: String? = null,
    @field:DecimalMin("0.0")
    @field:Digits(integer = 12, fraction = 0)
    val employeeCount: BigDecimal? = null,
)
