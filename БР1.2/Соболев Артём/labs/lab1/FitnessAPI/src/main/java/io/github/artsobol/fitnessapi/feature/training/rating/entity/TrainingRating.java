package io.github.artsobol.fitnessapi.feature.training.rating.entity;

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
@Table(name = "training_rating")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrainingRating {

    @EmbeddedId private TrainingUserId id;

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
    @Column(name = "rating", nullable = false)
    private int rating;

    @Getter
    @Column(name = "comment")
    private String comment;

    @Getter
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static TrainingRating create(Training training, User user, int rating, String comment) {
        TrainingRating entity = new TrainingRating();
        entity.user = user;
        entity.training = training;
        entity.id = new TrainingUserId(training.getId(), user.getId());
        entity.changeRating(rating);
        entity.changeComment(comment);

        return entity;
    }

    public void applyPatch(Integer rating, String comment) {
        if (rating != null) {
            this.changeRating(rating);
        }
        if (comment != null) {
            this.changeComment(comment);
        }
    }

    public void changeRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("rating must be between 1 and 5");
        }
        this.rating = rating;
    }

    public void changeComment(String comment) {
        this.comment = comment;
    }
}

