package ru.itmo.pxdkxvan.lab23.search.repository

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository
import ru.itmo.pxdkxvan.lab23.search.entity.VacancyDocument

interface VacancyDocumentRepository : ElasticsearchRepository<VacancyDocument, String>
