package io.github.artsobol.fitnessapi.feature.training.tag.service;

import io.github.artsobol.fitnessapi.exception.http.ConflictException;
import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.training.tag.dto.request.CreateTagRequest;
import io.github.artsobol.fitnessapi.feature.training.tag.dto.request.UpdateTagRequest;
import io.github.artsobol.fitnessapi.feature.training.tag.dto.response.TagResponse;
import io.github.artsobol.fitnessapi.feature.training.tag.entity.Tag;
import io.github.artsobol.fitnessapi.feature.training.tag.mapper.TagMapper;
import io.github.artsobol.fitnessapi.feature.training.tag.repository.TagRepository;
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
public class TagServiceImpl implements TagService, TagFinder {

    private final TagRepository tagRepository;
    private final TagMapper tagMapper;

    @Override
    public Slice<TagResponse> getTags(Pageable pageable) {
        log.debug(
                "Fetching tags page={}, size={} sort={}",
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return tagRepository.findAll(pageable).map(tagMapper::toResponse);
    }

    @Override
    public TagResponse getBySlug(String slug) {
        return tagMapper.toResponse(findBySlugOrThrow(slug));
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public TagResponse create(CreateTagRequest request) {
        log.info("Creating tag tagSlug={}", request.slug());
        ensureSlugNotExists(request.slug());
        Tag entity = Tag.create(request.name(), request.slug());
        tagRepository.save(entity);
        log.info("Tag created tagId={} tagSlug={}", entity.getId(), entity.getSlug());

        return tagMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public TagResponse update(String slug, UpdateTagRequest request) {
        log.info("Updating tag tagSlug={}", slug);
        Tag entity = findBySlugOrThrow(slug);
        String currentSlug = entity.getSlug();
        String newSlug = request.slug();
        ensureSlugUniqueIfChanged(currentSlug, newSlug);
        entity.applyUpdate(request.name(), newSlug);

        log.info("Tag updated tagId={} oldTagSlug={} newTagSlug={}", entity.getId(), currentSlug, entity.getSlug());
        return tagMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public void delete(String slug) {
        log.info("Deleting tag tagSlug={}", slug);
        Tag entity = findBySlugOrThrow(slug);
        tagRepository.delete(entity);

        log.info("Tag deleted tagId={} tagSlug={}", entity.getId(), entity.getSlug());
    }

    @Override
    public Tag findBySlugOrThrow(String slug) {
        log.debug("Fetching tag tagSlug={}", slug);
        return tagRepository.findBySlug(slug).orElseThrow(
                () -> new NotFoundException("{tag.slug.not.found}", slug)
        );
    }

    private void ensureSlugUniqueIfChanged(String currentSlug, String newSlug) {
        if (newSlug != null && !currentSlug.equals(newSlug)) {
            ensureSlugNotExists(newSlug);
        }
    }

    private void ensureSlugNotExists(String slug) {
        log.debug("Checking type uniqueness tagSlug={}", slug);
        if (tagRepository.existsBySlug(slug)) {
            throw new ConflictException("{tag.slug.exists}", slug);
        }
    }
}
