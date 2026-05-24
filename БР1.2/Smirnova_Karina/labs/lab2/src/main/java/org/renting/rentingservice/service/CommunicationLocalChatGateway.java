package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("communication")
@RequiredArgsConstructor
public class CommunicationLocalChatGateway implements CommunicationChatGateway {

    private final ChatService chatService;

    @Override
    public void ensureChatForListing(Long listingId, Long userA, Long userB) {
        chatService.findOrCreateForListing(listingId, userA, userB);
    }
}

