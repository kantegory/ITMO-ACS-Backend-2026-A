package io.github.artsobol.fitnessapi.feature.training.tag.service;

import io.github.artsobol.fitnessapi.feature.training.tag.entity.Tag;

public interface TagFinder {

    Tag findBySlugOrThrow(String slug);
}
