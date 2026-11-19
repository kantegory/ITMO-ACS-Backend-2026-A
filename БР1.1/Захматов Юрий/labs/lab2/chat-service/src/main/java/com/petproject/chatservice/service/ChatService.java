package com.petproject.chatservice.service;


import com.petproject.chatservice.dto.ChatCreateRequest;
import com.petproject.chatservice.dto.ChatResponse;
import com.petproject.chatservice.dto.UserShortResponse;
import com.petproject.chatservice.entities.ChatEntity;
import com.petproject.chatservice.entities.MessageEntity;
import com.petproject.chatservice.feign.AuthServiceClient;
import com.petproject.chatservice.repositories.ChatRepository;
import com.petproject.chatservice.repositories.MessageRepository;
import com.petproject.chatservice.security.JwtPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final AuthServiceClient authServiceClient;

    @Transactional
    public ChatResponse createChat(ChatCreateRequest request, JwtPrincipal user) {

        UserShortResponse user2 = authServiceClient.getUserById(request.user_toChat());


        if (user.userId().equals(request.user_toChat())) {
            throw new IllegalArgumentException("Cannot create chat with yourself");
        }

        ChatEntity existingChat = chatRepository.findByUsers(user.userId(), user2.id()).orElse(null);

        if (existingChat != null) {
            return mapToResponse(existingChat);
        }

        ChatEntity newChat = ChatEntity.builder()
                .user1Id(user.userId())
                .user2Id(user2.id())
                .user1Name(user.username())
                .user2Name(user2.username())
                .build();

        ChatEntity savedChat = chatRepository.save(newChat);
        return mapToResponse(savedChat);
    }

    @Transactional(readOnly = true)
    public Page<ChatResponse> getChats(JwtPrincipal user, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());


        Page<ChatEntity> chats = chatRepository.findAllByUserId(user.userId(), pageable);

        return chats.map(chat -> {
            Long otherUserId = chat.getUser1Id().equals(user.userId())
                    ? chat.getUser2Id()
                    : chat.getUser1Id();


            String otherUserName = chat.getUser1Id().equals(user.userId())
                    ? chat.getUser2Name()
                    : chat.getUser1Name();

            Optional<MessageEntity> lastMessage = messageRepository.findFirstByChatIdOrderByTimestampDesc(chat.getId());

            return ChatResponse.builder()
                               .chatId(chat.getId())
                               .otherUserId(otherUserId)
                               .otherUserName(otherUserName)
                               .lastMessage(lastMessage.map(MessageEntity::getMessage).orElse("Нет сообщений"))
                               .lastMessageTime(lastMessage.map(MessageEntity::getTimestamp).orElse(chat.getCreatedAt()))
                               .build();
        });
    }

    private ChatResponse mapToResponse(ChatEntity chat) {
        return ChatResponse.builder()
                .chatId(chat.getId())
                .otherUserId(chat.getUser2Id())
                .otherUserName(chat.getUser2Name())
                .build();
    }



}
