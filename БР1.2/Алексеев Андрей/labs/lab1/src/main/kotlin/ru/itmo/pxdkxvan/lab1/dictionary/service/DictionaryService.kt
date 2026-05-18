package ru.itmo.pxdkxvan.lab1.dictionary.service

import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab1.common.ApiErrorCode
import ru.itmo.pxdkxvan.lab1.common.ApiException
import ru.itmo.pxdkxvan.lab1.common.ItemsResponse
import ru.itmo.pxdkxvan.lab1.common.SystemRole
import ru.itmo.pxdkxvan.lab1.common.normalizeCode
import ru.itmo.pxdkxvan.lab1.common.requireCondition
import ru.itmo.pxdkxvan.lab1.dictionary.dto.DictionaryCreateRequest
import ru.itmo.pxdkxvan.lab1.dictionary.dto.DictionaryResponse
import ru.itmo.pxdkxvan.lab1.dictionary.dto.DictionaryUpdateRequest
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillCreateRequest
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillResponse
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillUpdateRequest
import ru.itmo.pxdkxvan.lab1.dictionary.entity.ExperienceLevelEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.IndustryEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.SkillEntity
import ru.itmo.pxdkxvan.lab1.dictionary.mapper.ExperienceLevelMapper
import ru.itmo.pxdkxvan.lab1.dictionary.mapper.IndustryMapper
import ru.itmo.pxdkxvan.lab1.dictionary.mapper.SkillMapper
import ru.itmo.pxdkxvan.lab1.dictionary.repository.ExperienceLevelRepository
import ru.itmo.pxdkxvan.lab1.dictionary.repository.IndustryRepository
import ru.itmo.pxdkxvan.lab1.dictionary.repository.SkillRepository
import ru.itmo.pxdkxvan.lab1.user.service.CurrentUserService
import java.util.UUID

@Service
class DictionaryService(
    private val currentUserService: CurrentUserService,
    private val industryRepository: IndustryRepository,
    private val experienceLevelRepository: ExperienceLevelRepository,
    private val skillRepository: SkillRepository,
    private val industryMapper: IndustryMapper,
    private val experienceLevelMapper: ExperienceLevelMapper,
    private val skillMapper: SkillMapper,
) {
    @Transactional(readOnly = true)
    fun industries(): ItemsResponse<DictionaryResponse> =
        ItemsResponse(
            industryRepository.findAllByIsActiveTrueOrderByDisplayNameAsc().map(industryMapper::toResponse),
        )

    @Transactional
    fun createIndustry(jwt: Jwt, request: DictionaryCreateRequest): DictionaryResponse {
        currentUserService.currentUserWithAnyRole(jwt, setOf(SystemRole.ADMIN, SystemRole.DICTIONARY_EDITOR))
        val code = validateDictionaryCode(request.code, "code")
        if (industryRepository.existsByCodeIgnoreCase(code)) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Industry code is already in use")
        }
        val entity = industryMapper.fromRawData(
            code = code,
            displayName = normalizeDisplayName(request.displayName),
            description = normalizeDescription(request.description),
            isActive = request.isActive,
        )
        val saved = industryRepository.saveAndFlush(entity)
        return industryMapper.toResponse(findIndustry(saved.id!!))
    }

    @Transactional
    fun updateIndustry(jwt: Jwt, industryId: UUID, request: DictionaryUpdateRequest): DictionaryResponse {
        currentUserService.currentUserWithAnyRole(jwt, setOf(SystemRole.ADMIN, SystemRole.DICTIONARY_EDITOR))
        val entity = findIndustry(industryId)
        applyUpdate(entity, request, industryRepository::existsByCodeIgnoreCase)
        return industryMapper.toResponse(industryRepository.save(entity))
    }

    @Transactional(readOnly = true)
    fun experienceLevels(): ItemsResponse<DictionaryResponse> =
        ItemsResponse(
            experienceLevelRepository.findAllByIsActiveTrueOrderByDisplayNameAsc().map(experienceLevelMapper::toResponse),
        )

    @Transactional
    fun createExperienceLevel(jwt: Jwt, request: DictionaryCreateRequest): DictionaryResponse {
        currentUserService.currentUserWithAnyRole(jwt, setOf(SystemRole.ADMIN, SystemRole.DICTIONARY_EDITOR))
        val code = validateDictionaryCode(request.code, "code")
        if (experienceLevelRepository.existsByCodeIgnoreCase(code)) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Experience level code is already in use")
        }
        val entity = experienceLevelMapper.fromRawData(
            code = code,
            displayName = normalizeDisplayName(request.displayName),
            description = normalizeDescription(request.description),
            isActive = request.isActive,
        )
        val saved = experienceLevelRepository.saveAndFlush(entity)
        return experienceLevelMapper.toResponse(findExperienceLevel(saved.id!!))
    }

    @Transactional
    fun updateExperienceLevel(jwt: Jwt, experienceLevelId: UUID, request: DictionaryUpdateRequest): DictionaryResponse {
        currentUserService.currentUserWithAnyRole(jwt, setOf(SystemRole.ADMIN, SystemRole.DICTIONARY_EDITOR))
        val entity = findExperienceLevel(experienceLevelId)
        applyUpdate(entity, request, experienceLevelRepository::existsByCodeIgnoreCase)
        return experienceLevelMapper.toResponse(experienceLevelRepository.save(entity))
    }

    @Transactional(readOnly = true)
    fun skills(): ItemsResponse<SkillResponse> =
        ItemsResponse(
            skillRepository.findAllByIsActiveTrueOrderByDisplayNameAsc().map(skillMapper::toSkillResponse),
        )

    @Transactional
    fun createSkill(jwt: Jwt, request: SkillCreateRequest): SkillResponse {
        currentUserService.currentUserWithAnyRole(jwt, setOf(SystemRole.ADMIN, SystemRole.DICTIONARY_EDITOR))
        val code = validateDictionaryCode(request.code, "code")
        if (skillRepository.existsByCodeIgnoreCase(code)) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Skill code is already in use")
        }
        val entity = skillMapper.fromRawData(
            code = code,
            displayName = normalizeDisplayName(request.displayName),
            description = normalizeDescription(request.description),
            isActive = request.isActive,
        )
        val saved = skillRepository.saveAndFlush(entity)
        return skillMapper.toSkillResponse(findSkill(saved.id!!))
    }

    @Transactional
    fun updateSkill(jwt: Jwt, skillId: UUID, request: SkillUpdateRequest): SkillResponse {
        currentUserService.currentUserWithAnyRole(jwt, setOf(SystemRole.ADMIN, SystemRole.DICTIONARY_EDITOR))
        val entity = findSkill(skillId)
        if (request.code != null) {
            val code = validateDictionaryCode(request.code, "code")
            if (code != entity.code && skillRepository.existsByCodeIgnoreCase(code)) {
                throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Skill code is already in use")
            }
            entity.code = code
        }
        request.displayName?.let {
            requireCondition(it.isNotBlank(), "display_name must not be blank", "display_name")
            entity.displayName = it.trim()
        }
        if (request.description != null) entity.description = request.description.trim().ifBlank { null }
        request.isActive?.let { entity.isActive = it }
        return skillMapper.toSkillResponse(skillRepository.save(entity))
    }

    fun findIndustry(id: UUID): IndustryEntity =
        industryRepository.findById(id).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Industry not found")
        }

    fun findExperienceLevel(id: UUID): ExperienceLevelEntity =
        experienceLevelRepository.findById(id).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Experience level not found")
        }

    fun findSkill(id: UUID): SkillEntity =
        skillRepository.findById(id).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Skill not found")
        }

    private fun validateDictionaryCode(raw: String, field: String): String {
        val normalized = normalizeCode(raw)
        requireCondition(normalized.isNotBlank(), "$field must not be blank", field)
        return normalized
    }

    private fun applyUpdate(
        entity: IndustryEntity,
        request: DictionaryUpdateRequest,
        codeExists: (String) -> Boolean,
    ) {
        request.code?.let {
            val normalized = validateDictionaryCode(it, "code")
            if (normalized != entity.code && codeExists(normalized)) {
                throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Dictionary code is already in use")
            }
            entity.code = normalized
        }

        request.displayName?.let {
            requireCondition(it.isNotBlank(), "display_name must not be blank", "display_name")
            entity.displayName = it.trim()
        }
        if (request.description != null) entity.description = request.description.trim().ifBlank { null }
        request.isActive?.let { entity.isActive = it }
    }

    private fun applyUpdate(
        entity: ExperienceLevelEntity,
        request: DictionaryUpdateRequest,
        codeExists: (String) -> Boolean,
    ) {
        request.code?.let {
            val normalized = validateDictionaryCode(it, "code")
            if (normalized != entity.code && codeExists(normalized)) {
                throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Dictionary code is already in use")
            }
            entity.code = normalized
        }

        request.displayName?.let {
            requireCondition(it.isNotBlank(), "display_name must not be blank", "display_name")
            entity.displayName = it.trim()
        }
        if (request.description != null) entity.description = request.description.trim().ifBlank { null }
        request.isActive?.let { entity.isActive = it }
    }

    private fun normalizeDisplayName(rawDisplayName: String): String {
        requireCondition(rawDisplayName.isNotBlank(), "display_name must not be blank", "display_name")
        return rawDisplayName.trim()
    }

    private fun normalizeDescription(rawDescription: String?): String? =
        rawDescription?.trim()?.ifBlank { null }
}
