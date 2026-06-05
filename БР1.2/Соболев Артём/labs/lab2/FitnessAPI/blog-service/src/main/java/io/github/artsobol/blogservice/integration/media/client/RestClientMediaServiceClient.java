package io.github.artsobol.blogservice.integration.media.client;

import io.github.artsobol.common.exception.http.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class RestClientMediaServiceClient implements MediaServiceClient {

    private final RestClient mediaServiceRestClient;

    @Override
    public void assertVideoExists(Long videoId) {
        try {
            RemoteVideoResponse response = mediaServiceRestClient.get()
                    .uri("/videos/{videoId}", videoId)
                    .retrieve()
                    .body(RemoteVideoResponse.class);

            if (response == null) {
                throw new IllegalStateException("media-service returned empty response for videoId=" + videoId);
            }
        } catch (HttpClientErrorException.NotFound ex) {
            throw new NotFoundException("video.id.not.found", videoId);
        }
    }

    private record RemoteVideoResponse(
            Long id,
            String title,
            String url
    ) {
    }
}
