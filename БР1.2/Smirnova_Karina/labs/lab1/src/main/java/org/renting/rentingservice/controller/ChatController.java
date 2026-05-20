package org.renting.rentingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.renting.rentingservice.dto.chat.ChatResponse;
import org.renting.rentingservice.dto.chat.CreateChatRequest;
import org.renting.rentingservice.dto.chat.MessageResponse;
import org.renting.rentingservice.dto.chat.SendMessageRequest;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.security.SecurityUtils;
import org.renting.rentingservice.service.ChatService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Chats", description = "Чаты и сообщения")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/chats")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Создать чат", description = "Создаёт чат с другим пользователем или возвращает существующий")
    public ChatResponse create(@Valid @RequestBody CreateChatRequest request) {
        return chatService.createChat(SecurityUtils.currentUserId(), request);
    }

    @GetMapping("/chats")
    @Operation(summary = "Список чатов", description = "Возвращает чаты текущего пользователя")
    public PageResponse<ChatResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        return chatService.listChats(SecurityUtils.currentUserId(), pageable);
    }

    @GetMapping("/chats/{chatId}/messages")
    @Operation(summary = "Сообщения чата", description = "Возвращает сообщения конкретного чата, отсортированные от новых к старым")
    public PageResponse<MessageResponse> listMessages(
            @PathVariable Long chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return chatService.listMessages(chatId, SecurityUtils.currentUserId(), pageable);
    }

    @PostMapping("/chats/{chatId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Отправить сообщение", description = "Добавляет новое сообщение в чат")
    public MessageResponse sendMessage(
            @PathVariable Long chatId,
            @Valid @RequestBody SendMessageRequest request) {
        return chatService.sendMessage(chatId, SecurityUtils.currentUserId(), request);
    }

    @DeleteMapping("/chats/{chatId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Удалить чат", description = "Удаляет чат, если текущий пользователь является его участником")
    public void delete(@PathVariable Long chatId) {
        chatService.deleteChat(chatId, SecurityUtils.currentUserId());
    }
}
