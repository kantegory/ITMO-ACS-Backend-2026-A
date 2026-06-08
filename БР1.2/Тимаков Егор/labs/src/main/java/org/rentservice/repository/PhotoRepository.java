package org.rentservice.repository;

import org.rentservice.data.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo,Long>
{

    List<Photo> findByOnwerRealtyId(Long realtyId);


}
