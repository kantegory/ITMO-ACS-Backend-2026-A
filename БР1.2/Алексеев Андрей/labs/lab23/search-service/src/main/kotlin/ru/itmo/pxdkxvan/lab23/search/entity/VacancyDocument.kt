package ru.itmo.pxdkxvan.lab23.search.entity

import org.springframework.data.annotation.Id
import org.springframework.data.elasticsearch.annotations.DateFormat
import org.springframework.data.elasticsearch.annotations.Document
import org.springframework.data.elasticsearch.annotations.Field
import org.springframework.data.elasticsearch.annotations.FieldType
import java.math.BigDecimal
import java.time.OffsetDateTime

@Document(indexName = "vacancies")
class VacancyDocument(
    @Id
    var vacancyId: String? = null,
    @Field(type = FieldType.Text)
    var title: String = "",
    @Field(type = FieldType.Text)
    var description: String = "",
    @Field(type = FieldType.Keyword)
    var companyId: String? = null,
    @Field(type = FieldType.Text)
    var companyName: String? = null,
    @Field(type = FieldType.Keyword)
    var country: String? = null,
    @Field(type = FieldType.Keyword)
    var city: String? = null,
    @Field(type = FieldType.Keyword)
    var metro: String? = null,
    @Field(type = FieldType.Double)
    var salaryFrom: BigDecimal? = null,
    @Field(type = FieldType.Double)
    var salaryTo: BigDecimal? = null,
    @Field(type = FieldType.Keyword)
    var currency: String? = null,
    @Field(type = FieldType.Keyword)
    var industryCode: String? = null,
    @Field(type = FieldType.Keyword)
    var experienceLevelCode: String? = null,
    @Field(type = FieldType.Keyword)
    var employmentType: String? = null,
    @Field(type = FieldType.Keyword)
    var workFormat: String? = null,
    @Field(type = FieldType.Keyword)
    var educationLevel: String? = null,
    @Field(type = FieldType.Keyword)
    var status: String? = null,
    @Field(type = FieldType.Date, format = [DateFormat.date_time])
    var publishedAt: OffsetDateTime? = null,
    @Field(type = FieldType.Keyword)
    var skillsCsv: String = "",
    @Field(type = FieldType.Long)
    var viewCount: Long = 0,
    @Field(type = FieldType.Long)
    var favoriteCount: Long = 0,
)
