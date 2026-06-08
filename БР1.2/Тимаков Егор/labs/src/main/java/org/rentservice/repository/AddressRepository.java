package org.rentservice.repository;


import org.rentservice.data.entity.Address;
import org.rentservice.data.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AddressRepository
        extends JpaRepository<Address, Long> {



}