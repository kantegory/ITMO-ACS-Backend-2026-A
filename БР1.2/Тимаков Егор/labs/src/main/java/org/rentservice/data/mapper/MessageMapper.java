package org.rentservice.data.mapper;


import org.mapstruct.Mapper;
import org.rentservice.data.entity.Message;
import org.rentservice.data.response.MessageResponse;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = UserMapper.class

)
public interface MessageMapper {

    MessageResponse toResponse(Message message);

    List<MessageResponse> toResponseList(List<Message> messages);
}
