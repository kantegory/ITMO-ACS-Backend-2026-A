package org.rentservice.repository;

import org.rentservice.data.entity.Contract;
import org.rentservice.data.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByCustomer(User customer);

    List<Contract> findByRealtyOwner(User owner);
}
