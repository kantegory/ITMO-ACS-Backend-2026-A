package com.petproject.itmoacsbackend.chats.service;

import com.petproject.itmoacsbackend.chats.dto.ChatCreateRequest;
import com.petproject.itmoacsbackend.chats.dto.ChatResponse;
import com.petproject.itmoacsbackend.chats.entities.ChatEntity;
import com.petproject.itmoacsbackend.chats.repositories.ChatRepository;
import com.petproject.itmoacsbackend.chats.entities.MessageEntity;
import com.petproject.itmoacsbackend.chats.repositories.MessageRepository;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import com.petproject.itmoacsbackend.users.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public ChatResponse createChat(ChatCreateRequest request, UserEntity user) {
        UserEntity user2 =  userRepository.findById(request.user_toChat())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));


        if (user.getId().equals(request.user_toChat())) {
            throw new IllegalArgumentException("Cannot create chat with yourself");
        }

        ChatEntity existingChat = chatRepository.findByUsers(user.getId(), user2.getId()).orElse(null);

        if (existingChat != null) {
            return mapToResponse(existingChat);
        }

        ChatEntity newChat = ChatEntity.builder()
                .user1Id(user)
                .user2Id(user2)
                .build();

        ChatEntity savedChat = chatRepository.save(newChat);
        return mapToResponse(savedChat);
    }

    @Transactional(readOnly = true)
    public Page<ChatResponse> getChats(UserEntity user, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<ChatEntity> chats = chatRepository.findAllByUserId(user.getId(), pageable);

        return chats.map(chat -> {
            Long otherUserId = chat.getUser1Id().getId().equals(user.getId())
                    ? chat.getUser2Id().getId()
                    : chat.getUser1Id().getId();

            String otherUserName = chat.getUser1Id().getId().equals(user.getId())
                    ? chat.getUser2Id().getUsername()
                    : chat.getUser1Id().getUsername();

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
                .otherUserId(chat.getUser2Id().getId())
                .otherUserName(chat.getUser2Id().getUsername())
                .build();
    }



}
