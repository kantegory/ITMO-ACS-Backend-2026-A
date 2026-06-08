package org.rentservice.service.message;


import org.rentservice.data.request.MessageRequest;
import org.rentservice.data.response.MessageResponse;

import java.util.List;

public interface MessageService {

    MessageResponse send(
            MessageRequest request
    );

    List<MessageResponse> getByContract(
            Long contractId
    );

    void delete(Long id);
}
