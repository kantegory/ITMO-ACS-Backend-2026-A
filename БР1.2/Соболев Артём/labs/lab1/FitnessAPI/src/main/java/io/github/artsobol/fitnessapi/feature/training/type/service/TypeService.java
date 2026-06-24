package io.github.artsobol.fitnessapi.feature.training.type.service;

import io.github.artsobol.fitnessapi.feature.training.type.dto.request.CreateTypeRequest;
import io.github.artsobol.fitnessapi.feature.training.type.dto.request.UpdateTypeRequest;
import io.github.artsobol.fitnessapi.feature.training.type.dto.response.TypeResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface TypeService {

    Slice<TypeResponse> getTypes(Pageable pageable);

    TypeResponse getBySlug(String slug);

    TypeResponse create(CreateTypeRequest request);

    TypeResponse update(String slug, UpdateTypeRequest request);

    void delete(String slug);
}
