package org.rentservice.service.message;


import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.rentservice.data.entity.Contract;
import org.rentservice.data.entity.Message;
import org.rentservice.data.entity.User;
import org.rentservice.data.mapper.MessageMapper;
import org.rentservice.data.request.MessageRequest;
import org.rentservice.data.request.SendMessageRequest;
import org.rentservice.data.response.MessageResponse;
import org.rentservice.repository.ContractRepository;
import org.rentservice.repository.MessageRepository;
import org.rentservice.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class MessageServiceImpl
        implements MessageService {

    private final MessageRepository messageRepository;

    private final UserRepository userRepository;

    private final ContractRepository contractRepository;

    private final MessageMapper messageMapper;


    public MessageResponse send(
            MessageRequest request
    ) {

        User sender =
                userRepository.findById(
                                request.getSenderId())
                        .orElseThrow();

        User recipient =
                userRepository.findById(
                                request.getRecipientId())
                        .orElseThrow();

        Contract contract =
                contractRepository.findById(
                                request.getContractId())
                        .orElseThrow();

        Message message =
                new Message();

        message.setSender(sender);
        message.setRecipient(recipient);
        message.setContract(contract);
        message.setText(
                request.getText());

        message.setCreated_at(
                new Date());

        return messageMapper.toResponse(
                messageRepository.save(
                        message
                )
        );
    }

    @Override
    public List<MessageResponse>
    getByContract(Long contractId) {

        return messageRepository
                .findByContractId(
                        contractId)
                .stream()
                .map(
                        messageMapper::toResponse
                )
                .toList();
    }

    public void delete(Long id) {

        messageRepository.deleteById(id);
    }
}