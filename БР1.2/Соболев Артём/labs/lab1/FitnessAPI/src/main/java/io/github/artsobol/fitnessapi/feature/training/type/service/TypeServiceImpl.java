package io.github.artsobol.fitnessapi.feature.training.type.service;

import io.github.artsobol.fitnessapi.exception.http.ConflictException;
import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.training.type.dto.request.CreateTypeRequest;
import io.github.artsobol.fitnessapi.feature.training.type.dto.request.UpdateTypeRequest;
import io.github.artsobol.fitnessapi.feature.training.type.dto.response.TypeResponse;
import io.github.artsobol.fitnessapi.feature.training.type.entity.Type;
import io.github.artsobol.fitnessapi.feature.training.type.mapper.TypeMapper;
import io.github.artsobol.fitnessapi.feature.training.type.repository.TypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TypeServiceImpl implements TypeService, TypeFinder {

    private final TypeRepository typeRepository;
    private final TypeMapper typeMapper;

    @Override
    public Slice<TypeResponse> getTypes(Pageable pageable) {
        log.debug(
                "Fetching types page={} size={} sort={}",
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return typeRepository.findAll(pageable).map(typeMapper::toResponse);
    }

    @Override
    public TypeResponse getBySlug(String typeSlug) {
        return typeMapper.toResponse(findBySlugOrThrow(typeSlug));
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public TypeResponse create(CreateTypeRequest request) {
        log.info("Creating type typeSlug={}", request.slug());
        ensureSlugNotExists(request.slug());
        Type entity = Type.create(request.name(), request.slug());
        typeRepository.save(entity);

        log.info("Type created typeId={} typeSlug={}", entity.getId(), entity.getSlug());
        return typeMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public TypeResponse update(String typeSlug, UpdateTypeRequest request) {
        log.info("Updating type typeSlug={}", typeSlug);
        Type entity = findBySlugOrThrow(typeSlug);
        String oldSlug = entity.getSlug();
        String newSlug = request.slug();
        ensureSlugUniqueIfChanged(oldSlug, newSlug);
        entity.applyUpdate(request.name(), newSlug);

        log.info(
                "Type updated typeId={} oldTypeSlug={} newTypeSlug={}",
                entity.getId(),
                oldSlug,
                newSlug
        );
        return typeMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public void delete(String typeSlug) {
        log.info("Deleting type typeSlug={}", typeSlug);
        Type entity = findBySlugOrThrow(typeSlug);
        typeRepository.delete(entity);
        log.info("Type deleted typeId={} typeSlug={}", entity.getId(), entity.getSlug());
    }

    @Override
    public Type findBySlugOrThrow(String typeSlug) {
        log.debug("Fetching type typeSlug={}", typeSlug);
        return typeRepository.findBySlug(typeSlug).orElseThrow(
                () -> new NotFoundException("{type.slug.not.found}", typeSlug)
        );
    }

    private void ensureSlugUniqueIfChanged(String currentSlug, String newSlug) {
        if (newSlug != null && !currentSlug.equals(newSlug)) {
            ensureSlugNotExists(newSlug);
        }
    }

    private void ensureSlugNotExists(String slug) {
        log.debug("Checking type uniqueness typeSlug={}", slug);
        if (typeRepository.existsBySlug(slug)) {
            throw new ConflictException("{type.slug.exists}", slug);
        }
    }
}
