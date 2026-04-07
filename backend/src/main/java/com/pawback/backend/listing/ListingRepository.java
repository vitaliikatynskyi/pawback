package com.pawback.backend.listing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ListingRepository extends JpaRepository<Listing, UUID> {
    List<Listing> findAllByOrderByCreatedAtDesc();
    
    @Query("SELECT l FROM Listing l WHERE l.status = :status")
    List<Listing> findByStatus(String status);
}
 
/**
 * Task: feat: implement distance-based search using postgis
 * Implemented during Pull Request #32
 * Timestamp: 2026-04-18T23:00:00
 */
 
