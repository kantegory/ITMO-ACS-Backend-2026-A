package com.petproject.itmoacsbackend.payments.repositories;

import com.petproject.itmoacsbackend.payments.entities.PaymentEntity;
import org.hibernate.boot.models.JpaAnnotations;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {
}
