package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.domain.entity.ChatEntity;
import org.renting.rentingservice.domain.entity.ListingEntity;
import org.renting.rentingservice.domain.entity.MessageEntity;
import org.renting.rentingservice.domain.entity.RentEntity;
import org.renting.rentingservice.domain.entity.UserEntity;
import org.renting.rentingservice.domain.enums.CommunicationMethod;
import org.renting.rentingservice.domain.enums.RentStatus;
import org.renting.rentingservice.dto.chat.ChatResponse;
import org.renting.rentingservice.dto.chat.CreateChatRequest;
import org.renting.rentingservice.dto.chat.MessageResponse;
import org.renting.rentingservice.dto.chat.SendMessageRequest;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.exception.ConflictException;
import org.renting.rentingservice.exception.ForbiddenException;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.mapper.ChatMapper;
import org.renting.rentingservice.repository.ChatRepository;
import org.renting.rentingservice.repository.MessageRepository;
import org.renting.rentingservice.repository.RentRepository;
import org.renting.rentingservice.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final RentRepository rentRepository;
    private final ChatMapper chatMapper;

    @Transactional
    public ChatResponse createChat(Long currentUserId, CreateChatRequest request) {
        if (currentUserId.equals(request.getOtherUserId())) {
            throw new ConflictException("Cannot create chat with yourself");
        }
        long user1Id = Math.min(currentUserId, request.getOtherUserId());
        long user2Id = Math.max(currentUserId, request.getOtherUserId());
        return chatRepository.findByUser1IdAndUser2Id(user1Id, user2Id)
                .map(chatMapper::toChatResponse)
                .orElseGet(() -> {
                    UserEntity user1 = userRepository.findById(user1Id)
                            .orElseThrow(() -> new NotFoundException("User not found"));
                    UserEntity user2 = userRepository.findById(user2Id)
                            .orElseThrow(() -> new NotFoundException("User not found"));
                    ChatEntity chat = ChatEntity.builder().user1(user1).user2(user2).build();
                    return chatMapper.toChatResponse(chatRepository.save(chat));
                });
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
        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new NotFoundException("User not found"));
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

    public ChatEntity findOrCreateBetween(Long userA, Long userB) {
        long user1Id = Math.min(userA, userB);
        long user2Id = Math.max(userA, userB);
        return chatRepository.findByUser1IdAndUser2Id(user1Id, user2Id).orElseGet(() -> {
            UserEntity user1 = userRepository.findById(user1Id).orElseThrow();
            UserEntity user2 = userRepository.findById(user2Id).orElseThrow();
            return chatRepository.save(ChatEntity.builder().user1(user1).user2(user2).build());
        });
    }

    private void promoteRentOnOwnerReply(ChatEntity chat, Long senderId) {
        rentRepository.findByGuestId(chat.getUser1().getId()).stream()
                .filter(r -> r.getListing().getOwner() != null)
                .forEach(r -> tryPromoteRent(r, chat, senderId));
        rentRepository.findByGuestId(chat.getUser2().getId()).stream()
                .filter(r -> r.getListing().getOwner() != null)
                .forEach(r -> tryPromoteRent(r, chat, senderId));
    }

    private void tryPromoteRent(RentEntity rent, ChatEntity chat, Long senderId) {
        ListingEntity listing = rent.getListing();
        if (listing.getOwner() == null) {
            return;
        }
        Long ownerId = listing.getOwner().getId();
        boolean participantsMatch = (chat.getUser1().getId().equals(rent.getGuest().getId())
                && chat.getUser2().getId().equals(ownerId))
                || (chat.getUser2().getId().equals(rent.getGuest().getId())
                && chat.getUser1().getId().equals(ownerId));
        if (participantsMatch && senderId.equals(ownerId) && rent.getStatus() == RentStatus.NEW) {
            rent.setStatus(RentStatus.IN_PROGRESS);
            rentRepository.save(rent);
        }
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
