package io.github.artsobol.fitnessapi.feature.video.service;

import io.github.artsobol.fitnessapi.exception.http.ConflictException;
import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.video.dto.request.CreateVideoRequest;
import io.github.artsobol.fitnessapi.feature.video.dto.request.UpdateVideoRequest;
import io.github.artsobol.fitnessapi.feature.video.dto.response.VideoResponse;
import io.github.artsobol.fitnessapi.feature.video.entity.Video;
import io.github.artsobol.fitnessapi.feature.video.mapper.VideoMapper;
import io.github.artsobol.fitnessapi.feature.video.repository.VideoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class VideoServiceImpl implements VideoService, VideoFinder {

    private final VideoRepository repository;
    private final VideoMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public VideoResponse getById(Long id) {
        Video entity = findByIdOrThrow(id);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('TRAINER', 'ADMIN')")
    public VideoResponse create(CreateVideoRequest request) {
        log.info("Creating video title={}", request.title());
        Video entity = Video.create(request.url(), request.title());
        repository.save(entity);

        log.info("Video created videoId={}", entity.getId());
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('TRAINER', 'ADMIN')")
    public VideoResponse update(Long videoId, UpdateVideoRequest request) {
        log.info("Updating video videoId={}", videoId);
        Video entity = findByIdOrThrow(videoId);
        String currentUrl = entity.getUrl();
        String newUrl = request.url();
        ensureUrlUniqueIfChanged(currentUrl, newUrl);
        entity.applyPatch(request.title(), newUrl);

        log.info("Video updated videoId={} oldVideoUrl={} newVideoUrl={}", entity.getId(), currentUrl, entity.getUrl());
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('TRAINER', 'ADMIN')")
    public void delete(Long id) {
        log.info("Deleting video videoId={}", id);
        Video entity = findByIdOrThrow(id);
        repository.delete(entity);
        log.info("Video deleted videoId={}", entity.getId());
    }

    public Video findByIdOrThrow(Long id) {
        log.debug("Fetching video videoId={}", id);
        return repository.findById(id).orElseThrow(
                () -> new NotFoundException("{video.not.found}", id)
        );
    }

    private void ensureUrlUniqueIfChanged(String currentUrl, String newUrl) {
        if (newUrl != null && !currentUrl.equals(newUrl)) {
            ensureUrlNotExists(newUrl);
        }
    }

    private void ensureUrlNotExists(String url) {
        log.debug("Checking video uniqueness videoUrl={}", url);
        if (repository.existsByUrl(url)) {
            throw new ConflictException("{video.url.exists}", url);
        }
    }
}
