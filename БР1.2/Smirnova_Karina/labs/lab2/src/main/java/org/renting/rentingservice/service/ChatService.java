package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.domain.entity.ChatEntity;
import org.renting.rentingservice.domain.entity.ListingEntity;
import org.renting.rentingservice.domain.entity.MessageEntity;
import org.renting.rentingservice.domain.entity.UserEntity;
import org.renting.rentingservice.domain.enums.RentStatus;
import org.renting.rentingservice.dto.chat.ChatResponse;
import org.renting.rentingservice.dto.chat.CreateChatRequest;
import org.renting.rentingservice.dto.chat.MessageResponse;
import org.renting.rentingservice.dto.chat.SendMessageRequest;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.exception.BusinessException;
import org.renting.rentingservice.exception.ConflictException;
import org.renting.rentingservice.exception.ForbiddenException;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.mapper.ChatMapper;
import org.renting.rentingservice.repository.ChatRepository;
import org.renting.rentingservice.repository.MessageRepository;
import org.renting.rentingservice.repository.RentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserDirectoryService userDirectoryService;
    private final ListingDirectoryService listingDirectoryService;
    private final RentRepository rentRepository;
    private final ChatMapper chatMapper;

    @Transactional
    public ChatResponse createChat(Long currentUserId, CreateChatRequest request) {
        if (currentUserId.equals(request.getOtherUserId())) {
            throw new ConflictException("Cannot create chat with yourself");
        }
        ListingEntity listing = listingDirectoryService.getOrSyncListing(request.getListingId());
        validateChatParticipants(listing, currentUserId, request.getOtherUserId());

        long user1Id = Math.min(currentUserId, request.getOtherUserId());
        long user2Id = Math.max(currentUserId, request.getOtherUserId());
        return chatRepository.findByUser1IdAndUser2IdAndListingId(user1Id, user2Id, listing.getId())
                .map(chatMapper::toChatResponse)
                .orElseGet(() -> {
                    UserEntity user1 = userDirectoryService.getOrSyncUser(user1Id);
                    UserEntity user2 = userDirectoryService.getOrSyncUser(user2Id);
                    ChatEntity chat = ChatEntity.builder()
                            .user1(user1)
                            .user2(user2)
                            .listing(listing)
                            .build();
                    return chatMapper.toChatResponse(chatRepository.save(chat));
                });
    }

    @Transactional
    public ChatResponse createInternalChat(Long user1Id, Long user2Id, Long listingId) {
        CreateChatRequest request = new CreateChatRequest();
        request.setListingId(listingId);
        request.setOtherUserId(user2Id);
        return createChat(user1Id, request);
    }

    @Transactional(readOnly = true)
    public PageResponse<ChatResponse> listChats(Long userId, Pageable pageable) {
        Page<ChatEntity> page = chatRepository.findByParticipant(userId, pageable);
        List<ChatResponse> content = page.getContent().stream().map(chatMapper::toChatResponse).toList();
        return PageResponse.from(page, content);
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageResponse> listMessages(Long chatId, Long userId, Pageable pageable) {
        assertParticipant(chatId, userId);
        Page<MessageEntity> page = messageRepository.findByChatId(chatId, pageable);
        List<MessageResponse> content = page.getContent().stream().map(chatMapper::toMessageResponse).toList();
        return PageResponse.from(page, content);
    }

    @Transactional
    public MessageResponse sendMessage(Long chatId, Long senderId, SendMessageRequest request) {
        ChatEntity chat = findChat(chatId);
        assertParticipant(chat, senderId);
        UserEntity sender = userDirectoryService.getOrSyncUser(senderId);
        MessageEntity message = MessageEntity.builder()
                .chat(chat)
                .sender(sender)
                .content(request.getContent())
                .build();
        message = messageRepository.save(message);
        promoteRentOnOwnerReply(chat, senderId);
        return chatMapper.toMessageResponse(message);
    }

    @Transactional
    public void deleteChat(Long chatId, Long userId) {
        ChatEntity chat = findChat(chatId);
        assertParticipant(chat, userId);
        chatRepository.delete(chat);
    }

    @Transactional
    public ChatEntity findOrCreateForListing(Long listingId, Long userA, Long userB) {
        ListingEntity listing = listingDirectoryService.getOrSyncListing(listingId);
        validateChatParticipants(listing, userA, userB);

        long user1Id = Math.min(userA, userB);
        long user2Id = Math.max(userA, userB);
        return chatRepository.findByUser1IdAndUser2IdAndListingId(user1Id, user2Id, listingId).orElseGet(() -> {
            UserEntity user1 = userDirectoryService.getOrSyncUser(user1Id);
            UserEntity user2 = userDirectoryService.getOrSyncUser(user2Id);
            return chatRepository.save(ChatEntity.builder()
                    .user1(user1)
                    .user2(user2)
                    .listing(listing)
                    .build());
        });
    }

    private void validateChatParticipants(ListingEntity listing, Long userA, Long userB) {
        if (listing.getOwner() == null) {
            throw new BusinessException("Listing has no owner");
        }
        Long ownerId = listing.getOwner().getId();
        Set<Long> participants = Set.of(userA, userB);
        if (!participants.contains(ownerId)) {
            throw new BusinessException("Chat must include the listing owner");
        }
        if (participants.size() != 2 || userA.equals(userB)) {
            throw new BusinessException("Chat must be between the listing owner and another user");
        }
    }

    private void promoteRentOnOwnerReply(ChatEntity chat, Long senderId) {
        ListingEntity listing = chat.getListing();
        if (listing.getOwner() == null || !listing.getOwner().getId().equals(senderId)) {
            return;
        }
        Long guestId = chat.getUser1().getId().equals(senderId)
                ? chat.getUser2().getId()
                : chat.getUser1().getId();
        rentRepository.findFirstByListingIdAndGuestIdOrderByCreatedAtDesc(listing.getId(), guestId)
                .filter(rent -> rent.getStatus() == RentStatus.NEW)
                .ifPresent(rent -> {
                    rent.setStatus(RentStatus.IN_PROGRESS);
                    rentRepository.save(rent);
                });
    }

    private ChatEntity findChat(Long chatId) {
        return chatRepository.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat not found"));
    }

    private void assertParticipant(Long chatId, Long userId) {
        if (!chatRepository.isParticipant(chatId, userId)) {
            throw new ForbiddenException("Not a chat participant");
        }
    }

    private void assertParticipant(ChatEntity chat, Long userId) {
        boolean participant = chat.getUser1().getId().equals(userId) || chat.getUser2().getId().equals(userId);
        if (!participant) {
            throw new ForbiddenException("Not a chat participant");
        }
    }
}
