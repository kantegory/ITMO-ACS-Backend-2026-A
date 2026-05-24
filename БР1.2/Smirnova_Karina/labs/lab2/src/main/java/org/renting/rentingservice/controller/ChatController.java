package org.renting.rentingservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.dto.chat.ChatResponse;
import org.renting.rentingservice.dto.chat.CreateChatRequest;
import org.renting.rentingservice.dto.chat.InternalCreateChatRequest;
import org.renting.rentingservice.dto.chat.MessageResponse;
import org.renting.rentingservice.dto.chat.SendMessageRequest;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.security.SecurityUtils;
import org.renting.rentingservice.service.ChatService;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Profile("communication")
@Tag(name = "Chats", description = "Chats and messages")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/chats")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create chat")
    public ChatResponse create(@Valid @RequestBody CreateChatRequest request) {
        return chatService.createChat(SecurityUtils.currentUserId(), request);
    }

    @PostMapping("/internal/chats")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create chat for internal services")
    public ChatResponse createInternal(@Valid @RequestBody InternalCreateChatRequest request) {
        return chatService.createInternalChat(request.getUser1Id(), request.getUser2Id(), request.getListingId());
    }

    @GetMapping("/chats")
    @Operation(summary = "List chats")
    public PageResponse<ChatResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        return chatService.listChats(SecurityUtils.currentUserId(), pageable);
    }

    @GetMapping("/chats/{chatId}/messages")
    @Operation(summary = "List messages")
    public PageResponse<MessageResponse> listMessages(
            @PathVariable Long chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return chatService.listMessages(chatId, SecurityUtils.currentUserId(), pageable);
    }

    @PostMapping("/chats/{chatId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Send message")
    public MessageResponse sendMessage(@PathVariable Long chatId, @Valid @RequestBody SendMessageRequest request) {
        return chatService.sendMessage(chatId, SecurityUtils.currentUserId(), request);
    }

    @DeleteMapping("/chats/{chatId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete chat")
    public void delete(@PathVariable Long chatId) {
        chatService.deleteChat(chatId, SecurityUtils.currentUserId());
    }
}
