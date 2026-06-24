package io.github.artsobol.fitnessapi.feature.training.training.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@AllArgsConstructor
@EqualsAndHashCode
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrainingUserId implements Serializable {

    @Column(name = "training_id")
    private Long trainingId;

    @Column(name = "user_id")
    private Long userId;
}
