package org.rentservice.data.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.rentservice.data.entity.Contract;
import org.rentservice.data.entity.User;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequest {


    private Long senderId;

    private Long recipientId;

    private Long contractId;

    private String text;





}
