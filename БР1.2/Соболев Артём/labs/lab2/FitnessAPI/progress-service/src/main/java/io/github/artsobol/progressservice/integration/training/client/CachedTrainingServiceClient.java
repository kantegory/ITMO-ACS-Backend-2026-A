package io.github.artsobol.progressservice.integration.training.client;

import io.github.artsobol.progressservice.integration.training.projection.TrainingCatalogProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Primary
@Component
@RequiredArgsConstructor
public class CachedTrainingServiceClient implements TrainingServiceClient {

    private final TrainingCatalogProjectionService projectionService;
    private final RestClientTrainingServiceClient restClientTrainingServiceClient;

    @Override
    public RemoteTrainingResponse getTrainingById(Long trainingId) {
        return projectionService.findActiveTraining(trainingId)
                .orElseGet(() -> restClientTrainingServiceClient.getTrainingById(trainingId));
    }
}
