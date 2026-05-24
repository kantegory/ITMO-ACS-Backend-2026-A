package org.renting.rentingservice.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile({"user", "notification"})
public class NoopCommunicationChatGateway implements CommunicationChatGateway {

    @Override
    public void ensureChatForListing(Long listingId, Long userA, Long userB) {
        throw new UnsupportedOperationException("Communication chat gateway is not available for this profile");
    }
}

