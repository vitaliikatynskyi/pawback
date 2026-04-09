package com.pawback.backend.listing;

import com.pawback.backend.listing.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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

    @PutMapping("/{id}")
    public ResponseEntity<ListingDto> updateListing(@PathVariable UUID id, @Valid @RequestBody CreateListingRequest request) {
        return ResponseEntity.ok(listingService.update(id, request));
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
}
 
 
 
 
 
 
