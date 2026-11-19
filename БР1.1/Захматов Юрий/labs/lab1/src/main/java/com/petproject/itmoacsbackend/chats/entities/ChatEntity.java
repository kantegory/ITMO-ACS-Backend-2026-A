package com.petproject.itmoacsbackend.chats.entities;

import com.petproject.itmoacsbackend.users.entities.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.LinkedList;
import java.util.List;

@Table(name = "chat")
@NoArgsConstructor
@Getter
@Setter
@Entity
@Builder
@AllArgsConstructor
public class ChatEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user1_id", nullable = false)
    private UserEntity user1Id;

    @ManyToOne
    @JoinColumn(name = "user2_id", nullable = false)
    private UserEntity user2Id;

    @Builder.Default
    @OneToMany(mappedBy = "chatId", cascade = CascadeType.ALL,  orphanRemoval = true)
    private List<MessageEntity> messages = new LinkedList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

}
