package org.rentservice.controller;


import lombok.RequiredArgsConstructor;
import org.rentservice.data.request.MessageRequest;
import org.rentservice.data.response.MessageResponse;
import org.rentservice.service.message.MessageService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public MessageResponse send(
            @RequestBody MessageRequest request
    ) {
        return messageService.send(request);
    }

    @GetMapping("/contract/{contractId}")
    public List<MessageResponse> getByContract(
            @PathVariable Long contractId
    ) {
        return messageService.getByContract(contractId);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {
        messageService.delete(id);
    }
}
