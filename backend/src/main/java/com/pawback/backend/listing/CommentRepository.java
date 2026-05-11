package com.pawback.backend.listing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findAllByListingIdOrderByCreatedAtDesc(java.util.UUID listingId);
}
