package io.github.artsobol.trainingservice.feature.training.tag.service;

import io.github.artsobol.trainingservice.feature.training.tag.dto.request.CreateTagRequest;
import io.github.artsobol.trainingservice.feature.training.tag.dto.request.UpdateTagRequest;
import io.github.artsobol.trainingservice.feature.training.tag.dto.response.TagResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface TagService {

    Slice<TagResponse> getTags(Pageable pageable);

    TagResponse getBySlug(String slug);

    TagResponse create(CreateTagRequest request);

    TagResponse update(String slug, UpdateTagRequest request);

    void delete(String slug);
}
