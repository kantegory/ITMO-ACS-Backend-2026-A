package org.rentservice.repository;

import org.rentservice.data.entity.Realty;
import org.rentservice.data.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RealtyRepository extends JpaRepository<Realty, Long>
{
    List<Realty> findByOwner(User owner);
}
