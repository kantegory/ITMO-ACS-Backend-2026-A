package com.petproject.chatservice.controllers;


import com.petproject.chatservice.dto.ChatCreateRequest;
import com.petproject.chatservice.dto.ChatResponse;
import com.petproject.chatservice.dto.MessageResponse;
import com.petproject.chatservice.dto.SendMessageRequest;
import com.petproject.chatservice.security.JwtPrincipal;
import com.petproject.chatservice.service.ChatService;
import com.petproject.chatservice.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        ChatResponse response = chatService.createChat(request, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<ChatResponse>> getChats(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        Page<ChatResponse> chats = chatService.getChats(user, page, size);
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/{chatId}")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @PathVariable("chatId") Long chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        Page<MessageResponse> messages = messageService.getMessages(chatId, page, size, user);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{chatId}")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable("chatId") Long chatId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal JwtPrincipal user
            ) {
        MessageResponse response = messageService.sendMessage(chatId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
