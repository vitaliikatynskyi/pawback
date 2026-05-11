package com.pawback.backend.listing.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreateListingRequest(
        @NotBlank String type,
        @NotBlank String petType,
        String petName,
        String breed,
        String color,
        String distinctiveMarks,
        String description,
        @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
        LocalDateTime eventDate,
        Double latitude,
        Double longitude,
        String city,
        String district,
        String addressText,
        BigDecimal rewardAmount,
        String rewardCurrency,
        java.util.List<String> imageUrls
) {}
