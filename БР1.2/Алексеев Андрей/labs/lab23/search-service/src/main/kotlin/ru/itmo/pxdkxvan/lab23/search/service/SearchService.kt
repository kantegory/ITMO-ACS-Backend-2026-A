package ru.itmo.pxdkxvan.lab23.search.service

import co.elastic.clients.elasticsearch._types.SortOrder
import co.elastic.clients.elasticsearch._types.SortOptions
import co.elastic.clients.elasticsearch._types.query_dsl.Query
import org.springframework.data.domain.PageRequest
import org.springframework.data.elasticsearch.client.elc.NativeQuery
import org.springframework.data.elasticsearch.core.ElasticsearchOperations
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.search.dto.Meta
import ru.itmo.pxdkxvan.lab23.search.dto.PageResponse
import ru.itmo.pxdkxvan.lab23.search.dto.VacancySearchResponse
import ru.itmo.pxdkxvan.lab23.search.entity.VacancyDocument
import ru.itmo.pxdkxvan.lab23.search.mapper.SearchMapper
import java.math.BigDecimal

@Service
class SearchService(
    private val elasticsearchOperations: ElasticsearchOperations,
    private val searchMapper: SearchMapper,
) {
    @Transactional(readOnly = true)
    fun search(
        text: String?,
        country: String?,
        city: String?,
        industryCode: String?,
        experienceLevel: String?,
        employmentType: String?,
        workFormat: String?,
        educationLevel: String?,
        salaryFrom: BigDecimal?,
        onlyWithSalary: Boolean?,
        sort: String,
        page: Int,
        limit: Int,
    ): PageResponse<VacancySearchResponse> {
        val filters = mutableListOf<Query>()
        filters += termQuery("status", "PUBLISHED")
        text.normalized()?.let { filters += multiMatchQuery(it) }
        country.normalized()?.let { filters += termQuery("country", it) }
        city.normalized()?.let { filters += termQuery("city", it) }
        industryCode.normalized()?.let { filters += termQuery("industryCode", it) }
        experienceLevel.normalized()?.let { filters += termQuery("experienceLevelCode", it) }
        employmentType.normalized()?.let { filters += termQuery("employmentType", it) }
        workFormat.normalized()?.let { filters += termQuery("workFormat", it) }
        educationLevel.normalized()?.let { filters += termQuery("educationLevel", it) }
        salaryFrom?.let { filters += salaryQuery(it) }
        if (onlyWithSalary == true) {
            filters += existsQuery("salaryFrom")
        }

        val query = NativeQuery.builder()
            .withQuery { q -> q.bool { b -> b.filter(filters) } }
            .withPageable(PageRequest.of(page - 1, limit))
            .withSort(sort.toSortOptions())
            .build()

        val hits = elasticsearchOperations.search(query, VacancyDocument::class.java)
        return PageResponse(
            items = hits.searchHits.map { searchMapper.toVacancySearchResponse(it.content) },
            meta = Meta(page = page, limit = limit, total = hits.totalHits),
        )
    }
}

private fun String?.normalized(): String? = this?.trim()?.ifBlank { null }

private fun termQuery(field: String, value: String): Query =
    Query.of { q -> q.term { t -> t.field(field).value(value) } }

private fun existsQuery(field: String): Query =
    Query.of { q -> q.exists { e -> e.field(field) } }

private fun multiMatchQuery(value: String): Query =
    Query.of { q ->
        q.bool { b ->
            b.should(
                Query.of { it.match { m -> m.field("title").query(value) } },
                Query.of { it.match { m -> m.field("description").query(value) } },
                Query.of { it.match { m -> m.field("companyName").query(value) } },
            ).minimumShouldMatch("1")
        }
    }

private fun salaryQuery(value: BigDecimal): Query =
    Query.of { q ->
        q.bool { b ->
            b.should(
                Query.of { it.range { r -> r.number { n -> n.field("salaryFrom").gte(value.toDouble()) } } },
                Query.of { it.range { r -> r.number { n -> n.field("salaryTo").gte(value.toDouble()) } } },
            ).minimumShouldMatch("1")
        }
    }

private fun String.toSortOptions(): SortOptions =
    SortOptions.of { option ->
        option.field { field ->
            field.field(
                when (lowercase()) {
                    "salary_desc", "salary_asc" -> "salaryFrom"
                    "popularity" -> "viewCount"
                    else -> "publishedAt"
                },
            ).order(
                when (lowercase()) {
                    "salary_asc" -> SortOrder.Asc
                    else -> SortOrder.Desc
                },
            )
        }
    }
