package io.github.artsobol.fitnessapi.feature.training.favourite.entity;

import io.github.artsobol.fitnessapi.feature.training.training.entity.Training;
import io.github.artsobol.fitnessapi.feature.training.training.entity.TrainingUserId;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
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
    @MapsId("trainingId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_id", nullable = false)
    private Training training;

    @Getter
    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Getter
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static TrainingFavourite create(Training training, User user) {
        TrainingFavourite entity = new TrainingFavourite();
        entity.user = user;
        entity.training = training;
        entity.id = new TrainingUserId(training.getId(), user.getId());

        return entity;
    }


}

