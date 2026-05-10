package io.github.artsobol.progressservice.integration.training.client;

import io.github.artsobol.common.exception.http.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RestClientTrainingServiceClient implements TrainingServiceClient {

    private final RestClient trainingServiceRestClient;

    @Override
    public RemoteTrainingResponse getTrainingById(Long trainingId) {
        try {
            RemoteTrainingResponse response = trainingServiceRestClient.get()
                    .uri("/trainings/{trainingId}", trainingId)
                    .retrieve()
                    .body(RemoteTrainingResponse.class);

            if (response == null) {
                throw new IllegalStateException("training-service returned empty response for trainingId=" + trainingId);
            }

            return new RemoteTrainingResponse(
                    response.id(),
                    response.exercises() == null ? List.of() : response.exercises()
            );
        } catch (HttpClientErrorException.NotFound ex) {
            throw new NotFoundException("training.id.not.found", trainingId);
        }
    }
}
