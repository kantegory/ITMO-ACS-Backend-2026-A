package com.petproject.itmoacsbackend.chats.service;

import com.petproject.itmoacsbackend.auth.enums.GlobalRole;
import com.petproject.itmoacsbackend.chats.dto.MessageResponse;
import com.petproject.itmoacsbackend.chats.dto.SendMessageRequest;
import com.petproject.itmoacsbackend.chats.entities.ChatEntity;
import com.petproject.itmoacsbackend.chats.entities.MessageEntity;
import com.petproject.itmoacsbackend.chats.repositories.ChatRepository;
import com.petproject.itmoacsbackend.chats.repositories.MessageRepository;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import com.petproject.itmoacsbackend.users.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;

    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessages (
            Long chatId,
            int page,
            int size,
            UserEntity user
    ) throws EntityNotFoundException, SecurityException {
        ChatEntity chat = chatRepository.findById(chatId).orElseThrow(
                () -> new EntityNotFoundException("Chat with id " + chatId + " not found")
        );

        if (!chat.getUser1Id().getId().equals(user.getId()) && !chat.getUser2Id().getId().equals(user.getId()) && user.getGlobalRole() != GlobalRole.ADMIN) {
            throw new SecurityException("You don't have permission to access this resource");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));

        return messageRepository.findByChatIdOrderByTimestampDesc(chatId, pageable).map(
                this::mapToResponse
        );
    }

    @Transactional
    public MessageResponse sendMessage(Long chatId ,SendMessageRequest request, UserEntity user) {
        ChatEntity chat = chatRepository.findById(chatId).orElseThrow(
                () -> new EntityNotFoundException("Chat with id " + chatId + " not found")
        );

        boolean isParticipant = chat.getUser1Id().getId().equals(user.getId()) || chat.getUser2Id().getId().equals(user.getId());

        if (!isParticipant && user.getGlobalRole() != GlobalRole.ADMIN) {
            throw new SecurityException("You don't have permission to access this resource");
        }

        MessageEntity message = new MessageEntity().builder()
                .chatId(chat)
                .senderId(user)
                .message(request.content())
                .build();

        MessageEntity savedMessage = messageRepository.save(message);

        return mapToResponse(savedMessage);
    }

    private MessageResponse mapToResponse(MessageEntity message) {
        return new MessageResponse(
                message.getId(),
                message.getSenderId().getId(),
                message.getMessage(),
                message.getTimestamp()
        );
    }

}
