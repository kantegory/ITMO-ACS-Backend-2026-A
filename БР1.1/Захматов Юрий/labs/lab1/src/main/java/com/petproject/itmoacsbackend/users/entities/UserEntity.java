package com.petproject.itmoacsbackend.users.entities;

import com.petproject.itmoacsbackend.auth.enums.GlobalRole;
import com.petproject.itmoacsbackend.chats.entities.MessageEntity;
import com.petproject.itmoacsbackend.property.entities.PropertyEntity;
import com.petproject.itmoacsbackend.reviews.entities.ReviewEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Table(name = "_user_")
@NoArgsConstructor
@Getter
@Setter
@Entity
@Builder
@AllArgsConstructor
public class UserEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_id_seq")
    @SequenceGenerator(name = "user_id_seq", sequenceName = "user_id_seq", allocationSize = 1)
    private Long id;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GlobalRole globalRole = GlobalRole.USER;

    @Builder.Default
    private Boolean isRenter = true;

    @Builder.Default
    private Boolean isLandlord = false;

    @Column(nullable = false,  unique = true)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false,  unique = true)
    private String email;

    @Column(length = 20)
    private String phoneNumber;

    private String firstName;

    private String lastName;

    private String patronymic;


    @Builder.Default
    @OneToMany(mappedBy = "userId", cascade = CascadeType.ALL,  orphanRemoval = true)
    private List<PropertyEntity> properties = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "id",  cascade = CascadeType.ALL,  orphanRemoval = true)
    private List<ReviewEntity> reviews = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "senderId", cascade = CascadeType.ALL,  orphanRemoval = true)
    private List<MessageEntity> messages = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(globalRole.name()));
    }

    @Override
    public String getPassword() {
        return this.passwordHash;
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }
}
