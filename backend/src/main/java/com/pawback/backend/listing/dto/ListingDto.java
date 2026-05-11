package com.pawback.backend.listing.dto;

import com.pawback.backend.listing.Listing;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ListingDto(
        UUID id,
        String type,
        String status,
        String petType,
        String petName,
        String breed,
        String color,
        String distinctiveMarks,
        String description,
        LocalDateTime eventDate,
        String city,
        String district,
        String addressText,
        BigDecimal rewardAmount,
        String rewardCurrency,
        Integer viewsCount,
        Integer contactsCount,
        Integer sharesCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime expiresAt,
        Double latitude,
        Double longitude,
        UserDto author,
        java.util.List<String> imageUrls
) {
    public static ListingDto from(Listing listing) {
        Double lat = null, lng = null;
        if (listing.getLocation() != null) {
            lat = listing.getLocation().getY();
            lng = listing.getLocation().getX();
        }
        return new ListingDto(
                listing.getId(),
                listing.getType(),
                listing.getStatus(),
                listing.getPetType(),
                listing.getPetName(),
                listing.getBreed(),
                listing.getColor(),
                listing.getDistinctiveMarks(),
                listing.getDescription(),
                listing.getEventDate(),
                listing.getCity(),
                listing.getDistrict(),
                listing.getAddressText(),
                listing.getRewardAmount(),
                listing.getRewardCurrency(),
                listing.getViewsCount(),
                listing.getContactsCount(),
                listing.getSharesCount(),
                listing.getCreatedAt(),
                listing.getUpdatedAt(),
                listing.getExpiresAt(),
                lat,
                lng,
                UserDto.from(listing.getAuthor()),
                listing.getImageUrls()
        );
    }
}
