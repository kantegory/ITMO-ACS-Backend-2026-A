package org.rentservice.repository;


import org.rentservice.data.entity.Message;
import org.rentservice.data.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {


    List<Message> findByContractId(Long contractId);

    List<Message> findBySender(User sender);

    List<Message> findByRecipient(User recipient);

}
