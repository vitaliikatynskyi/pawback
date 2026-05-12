package com.pawback.backend.listing;

import com.pawback.backend.listing.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    @GetMapping
    public List<ListingDto> getAllListings(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String petType,
            @RequestParam(required = false) String city
    ) {
        return listingService.findAll(type, petType, city);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingDto> getListingById(@PathVariable UUID id) {
        return listingService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ListingDto> createListing(@Valid @RequestBody CreateListingRequest request) {
        return ResponseEntity.ok(listingService.create(request));
    }

    @GetMapping("/my")
    public List<ListingDto> getMyListings() {
        return listingService.findByCurrentUser();
    }

    @PutMapping("/{id}")
    public ResponseEntity<ListingDto> updateListing(@PathVariable UUID id, @Valid @RequestBody CreateListingRequest request) {
        return ResponseEntity.ok(listingService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ListingDto> updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Set<String> allowed = Set.of("ACTIVE", "RESOLVED", "EXPIRED", "ARCHIVED");
        if (!allowed.contains(status.toUpperCase())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(listingService.updateStatus(id, status));
    }

    @GetMapping("/{id}/comments")
    public List<CommentDto> getComments(@PathVariable UUID id) {
        return listingService.getComments(id);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDto> addComment(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(listingService.addComment(id, content));
    }

    @PostMapping("/{id}/embedding")
    public ResponseEntity<Void> saveEmbedding(@PathVariable UUID id, @RequestBody EmbeddingRequest req) {
        listingService.saveEmbedding(id, req.embedding());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/similar")
    public List<ListingDto> findSimilar(@RequestBody EmbeddingRequest req) {
        return listingService.findSimilar(req.embedding(), req.petType(), 20);
    }
}
 
 
 
 
