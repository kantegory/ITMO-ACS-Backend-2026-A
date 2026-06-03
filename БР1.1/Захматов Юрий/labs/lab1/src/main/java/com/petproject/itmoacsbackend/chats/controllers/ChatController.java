package com.petproject.itmoacsbackend.chats.controllers;


import com.petproject.itmoacsbackend.chats.dto.ChatCreateRequest;
import com.petproject.itmoacsbackend.chats.dto.ChatResponse;
import com.petproject.itmoacsbackend.chats.dto.MessageResponse;
import com.petproject.itmoacsbackend.chats.dto.SendMessageRequest;
import com.petproject.itmoacsbackend.chats.service.ChatService;
import com.petproject.itmoacsbackend.chats.service.MessageService;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.server.autoconfigure.servlet.ForwardedHeaderFilterCustomizer;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final MessageService messageService;

    @PostMapping("/new")
    public ResponseEntity<ChatResponse> createChat(
            @Valid @RequestBody ChatCreateRequest request,
            @AuthenticationPrincipal UserEntity user
    ) {
        ChatResponse response = chatService.createChat(request, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<ChatResponse>> getChats(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserEntity user
    ) {
        Page<ChatResponse> chats = chatService.getChats(user, page, size);
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @PathVariable("chatId") Long chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserEntity user
    ) {
        Page<MessageResponse> messages = messageService.getMessages(chatId, page, size, user);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{chatId}")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable("chatId") Long chatId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserEntity user
            ) {
        MessageResponse response = messageService.sendMessage(chatId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
