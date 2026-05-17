package org.renting.rentingservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.renting.rentingservice.domain.entity.ChatEntity;
import org.renting.rentingservice.domain.entity.MessageEntity;
import org.renting.rentingservice.dto.chat.ChatResponse;
import org.renting.rentingservice.dto.chat.MessageResponse;

@Mapper(componentModel = "spring")
public interface ChatMapper {

    @Mapping(target = "user1Id", source = "user1.id")
    @Mapping(target = "user2Id", source = "user2.id")
    ChatResponse toChatResponse(ChatEntity entity);

    @Mapping(target = "chatId", source = "chat.id")
    @Mapping(target = "senderId", source = "sender.id")
    MessageResponse toMessageResponse(MessageEntity entity);
}
