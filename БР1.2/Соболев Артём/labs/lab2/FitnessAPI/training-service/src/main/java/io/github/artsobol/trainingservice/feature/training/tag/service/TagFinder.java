package io.github.artsobol.trainingservice.feature.training.tag.service;

import io.github.artsobol.trainingservice.feature.training.tag.entity.Tag;

public interface TagFinder {

    Tag findBySlugOrThrow(String slug);
}
