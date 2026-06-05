package io.github.artsobol.progressservice.integration.training.projection;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrainingCatalogRepository extends JpaRepository<TrainingCatalog, Long> {

    Optional<TrainingCatalog> findByIdAndActiveTrue(Long id);
}
