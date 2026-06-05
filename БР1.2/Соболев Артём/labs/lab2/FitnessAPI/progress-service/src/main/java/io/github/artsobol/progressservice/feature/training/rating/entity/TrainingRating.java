package io.github.artsobol.progressservice.feature.training.rating.entity;

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
@Table(name = "training_rating")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrainingRating {

    @EmbeddedId
    private TrainingUserId id;

    @Getter
    @Column(name = "training_id", nullable = false, insertable = false, updatable = false)
    private Long trainingId;

    @Getter
    @Column(name = "user_id", nullable = false, insertable = false, updatable = false)
    private Long userId;

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

    public static TrainingRating create(Long trainingId, Long userId, int rating, String comment) {
        TrainingRating entity = new TrainingRating();
        entity.userId = userId;
        entity.trainingId = trainingId;
        entity.id = new TrainingUserId(trainingId, userId);
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
