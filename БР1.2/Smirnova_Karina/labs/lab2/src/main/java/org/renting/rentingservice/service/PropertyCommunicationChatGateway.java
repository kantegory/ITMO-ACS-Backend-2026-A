package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.dto.chat.InternalCreateChatRequest;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@Profile("property")
@RequiredArgsConstructor
public class PropertyCommunicationChatGateway implements CommunicationChatGateway {

    private final RestClient communicationServiceRestClient;

    @Override
    public void ensureChatForListing(Long listingId, Long userA, Long userB) {
        InternalCreateChatRequest request = new InternalCreateChatRequest();
        request.setListingId(listingId);
        request.setUser1Id(userA);
        request.setUser2Id(userB);

        communicationServiceRestClient.post()
                .uri("/internal/chats")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .toBodilessEntity();
    }
}

