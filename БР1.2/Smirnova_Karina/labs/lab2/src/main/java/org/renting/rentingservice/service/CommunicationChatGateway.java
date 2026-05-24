package org.renting.rentingservice.service;

public interface CommunicationChatGateway {

    void ensureChatForListing(Long listingId, Long userA, Long userB);
}

