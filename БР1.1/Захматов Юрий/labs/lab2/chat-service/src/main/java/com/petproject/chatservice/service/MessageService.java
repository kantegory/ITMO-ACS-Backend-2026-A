package com.petproject.chatservice.service;


import com.petproject.chatservice.dto.MessageResponse;
import com.petproject.chatservice.dto.SendMessageRequest;
import com.petproject.chatservice.entities.ChatEntity;
import com.petproject.chatservice.entities.MessageEntity;
import com.petproject.chatservice.repositories.ChatRepository;
import com.petproject.chatservice.repositories.MessageRepository;
import com.petproject.chatservice.security.JwtPrincipal;
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
            JwtPrincipal user
    ) throws EntityNotFoundException, SecurityException {
        ChatEntity chat = chatRepository.findById(chatId).orElseThrow(
                () -> new EntityNotFoundException("Chat with id " + chatId + " not found")
        );

        if (!chat.getUser1Id().equals(user.userId()) && !chat.getUser2Id().equals(user.userId()) && !user.role().equals("ADMIN")) {
            throw new SecurityException("You don't have permission to access this resource");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));

        return messageRepository.findByChatIdOrderByTimestampDesc(chatId, pageable).map(
                this::mapToResponse
        );
    }

    @Transactional
    public MessageResponse sendMessage(Long chatId , SendMessageRequest request, JwtPrincipal user) {
        ChatEntity chat = chatRepository.findById(chatId).orElseThrow(
                () -> new EntityNotFoundException("Chat with id " + chatId + " not found")
        );

        boolean isParticipant = chat.getUser1Id().equals(user.userId()) || chat.getUser2Id().equals(user.userId());

        if (!isParticipant && !user.role().equals("ADMIN")) {
            throw new SecurityException("You don't have permission to access this resource");
        }

        MessageEntity message = MessageEntity.builder()
                                             .chatId(chat)
                                             .senderId(user.userId())
                                             .message(request.content())
                                             .build();

        MessageEntity savedMessage = messageRepository.save(message);

        return mapToResponse(savedMessage);
    }

    private MessageResponse mapToResponse(MessageEntity message) {
        return new MessageResponse(
                message.getId(),
                message.getSenderId(),
                message.getMessage(),
                message.getTimestamp()
        );
    }

}
