package io.github.artsobol.progressservice.feature.training.favourite.entity;

import io.github.artsobol.progressservice.feature.training.shared.entity.TrainingUserId;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "training_favourite")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrainingFavourite {

    @EmbeddedId
    private TrainingUserId id;

    @Getter
    @Column(name = "training_id", nullable = false, insertable = false, updatable = false)
    private Long trainingId;

    @Getter
    @Column(name = "user_id", nullable = false, insertable = false, updatable = false)
    private Long userId;

    @Getter
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static TrainingFavourite create(Long trainingId, Long userId) {
        TrainingFavourite entity = new TrainingFavourite();
        entity.trainingId = trainingId;
        entity.userId = userId;
        entity.id = new TrainingUserId(trainingId, userId);

        return entity;
    }
}

